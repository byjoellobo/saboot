//! Streaming multi-algorithm hasher for Saboot.
//!
//! A single pass over the input updates MD5, SHA-1, SHA-256 and CRC32 at the
//! same time, so very large files (multi-gigabyte CCTV exports) are read once.
//!
//! The WebAssembly build exposes a small C ABI instead of wasm-bindgen glue, so
//! the JavaScript side only needs `WebAssembly.instantiate`:
//!
//! ```text
//! sk_abi_version() -> u32
//! sk_alloc(len) -> *mut u8          sk_free(ptr, len)
//! sk_hasher_new() -> *mut Hasher    sk_hasher_free(h)
//! sk_hasher_update(h, ptr, len)
//! sk_hasher_finish(h, out_ptr)      // consumes h, writes DIGEST_LEN bytes
//! ```
//!
//! Output layout written by `sk_hasher_finish` (big-endian where numeric):
//! `md5[16] | sha1[20] | sha256[32] | crc32[4] | length[8]` = 80 bytes.

use md5::{Digest, Md5};
use sha1::Sha1;
use sha2::Sha256;

/// Version of the exported ABI. Bump when the exports or output layout change.
pub const ABI_VERSION: u32 = 1;

pub const MD5_LEN: usize = 16;
pub const SHA1_LEN: usize = 20;
pub const SHA256_LEN: usize = 32;
pub const CRC32_LEN: usize = 4;
pub const LENGTH_LEN: usize = 8;
pub const DIGEST_LEN: usize = MD5_LEN + SHA1_LEN + SHA256_LEN + CRC32_LEN + LENGTH_LEN;

/// Finished digests for one input stream.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Digests {
    pub md5: [u8; MD5_LEN],
    pub sha1: [u8; SHA1_LEN],
    pub sha256: [u8; SHA256_LEN],
    pub crc32: u32,
    pub length: u64,
}

impl Digests {
    /// Serialise into the fixed 80-byte layout documented at the crate root.
    pub fn to_bytes(&self) -> [u8; DIGEST_LEN] {
        let mut out = [0u8; DIGEST_LEN];
        let mut at = 0;
        out[at..at + MD5_LEN].copy_from_slice(&self.md5);
        at += MD5_LEN;
        out[at..at + SHA1_LEN].copy_from_slice(&self.sha1);
        at += SHA1_LEN;
        out[at..at + SHA256_LEN].copy_from_slice(&self.sha256);
        at += SHA256_LEN;
        out[at..at + CRC32_LEN].copy_from_slice(&self.crc32.to_be_bytes());
        at += CRC32_LEN;
        out[at..at + LENGTH_LEN].copy_from_slice(&self.length.to_be_bytes());
        out
    }
}

/// Incremental hasher that feeds every chunk to all algorithms.
#[derive(Clone, Default)]
pub struct MultiHasher {
    md5: Md5,
    sha1: Sha1,
    sha256: Sha256,
    crc32: crc32fast::Hasher,
    length: u64,
}

impl MultiHasher {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn update(&mut self, data: &[u8]) {
        self.md5.update(data);
        self.sha1.update(data);
        self.sha256.update(data);
        self.crc32.update(data);
        self.length += data.len() as u64;
    }

    pub fn finalize(self) -> Digests {
        let mut md5 = [0u8; MD5_LEN];
        md5.copy_from_slice(&self.md5.finalize()[..]);
        let mut sha1 = [0u8; SHA1_LEN];
        sha1.copy_from_slice(&self.sha1.finalize()[..]);
        let mut sha256 = [0u8; SHA256_LEN];
        sha256.copy_from_slice(&self.sha256.finalize()[..]);
        Digests {
            md5,
            sha1,
            sha256,
            crc32: self.crc32.finalize(),
            length: self.length,
        }
    }
}

/// Convenience one-shot helper (used by tests and native callers).
pub fn hash_all(data: &[u8]) -> Digests {
    let mut h = MultiHasher::new();
    h.update(data);
    h.finalize()
}

// ---------------------------------------------------------------------------
// C ABI used by the WebAssembly build.
// ---------------------------------------------------------------------------

#[no_mangle]
pub extern "C" fn sk_abi_version() -> u32 {
    ABI_VERSION
}

#[no_mangle]
pub extern "C" fn sk_digest_len() -> u32 {
    DIGEST_LEN as u32
}

/// Allocate `len` bytes inside linear memory for the caller to fill.
#[no_mangle]
pub extern "C" fn sk_alloc(len: usize) -> *mut u8 {
    let mut buf: Vec<u8> = Vec::with_capacity(len.max(1));
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

/// Release memory previously returned by [`sk_alloc`].
///
/// # Safety
/// `ptr` must come from `sk_alloc(len)` with the same `len`, and must not be
/// used afterwards.
#[no_mangle]
pub unsafe extern "C" fn sk_free(ptr: *mut u8, len: usize) {
    if ptr.is_null() {
        return;
    }
    // SAFETY: the caller guarantees `ptr` came from `sk_alloc(len)`, which leaked a
    // Vec with capacity `len.max(1)`; rebuilding it with that capacity frees it.
    drop(Vec::from_raw_parts(ptr, 0, len.max(1)));
}

#[no_mangle]
pub extern "C" fn sk_hasher_new() -> *mut MultiHasher {
    Box::into_raw(Box::new(MultiHasher::new()))
}

/// Feed `len` bytes at `ptr` into the hasher.
///
/// # Safety
/// `h` must be a live pointer from [`sk_hasher_new`]; `ptr..ptr+len` must be
/// readable memory.
#[no_mangle]
pub unsafe extern "C" fn sk_hasher_update(h: *mut MultiHasher, ptr: *const u8, len: usize) {
    if h.is_null() || (ptr.is_null() && len > 0) {
        return;
    }
    let data = if len == 0 {
        &[][..]
    } else {
        // SAFETY: the caller guarantees `ptr..ptr+len` is initialised, readable memory
        // that is not mutated while this call runs.
        std::slice::from_raw_parts(ptr, len)
    };
    // SAFETY: `h` is non-null and, per the contract, a live hasher from `sk_hasher_new`.
    (*h).update(data);
}

/// Finish hashing, write [`DIGEST_LEN`] bytes to `out`, and free the hasher.
///
/// # Safety
/// `h` must be a live pointer from [`sk_hasher_new`] (it is consumed);
/// `out..out+DIGEST_LEN` must be writable memory.
#[no_mangle]
pub unsafe extern "C" fn sk_hasher_finish(h: *mut MultiHasher, out: *mut u8) {
    if h.is_null() || out.is_null() {
        return;
    }
    // SAFETY: `h` was produced by `Box::into_raw` in `sk_hasher_new` and is consumed here.
    let hasher = Box::from_raw(h);
    let bytes = hasher.finalize().to_bytes();
    // SAFETY: the caller guarantees `out..out+DIGEST_LEN` is writable and does not
    // overlap the local `bytes` array.
    std::ptr::copy_nonoverlapping(bytes.as_ptr(), out, DIGEST_LEN);
}

/// Discard a hasher without producing output (used on cancel).
///
/// # Safety
/// `h` must be a live pointer from [`sk_hasher_new`] (it is consumed).
#[no_mangle]
pub unsafe extern "C" fn sk_hasher_free(h: *mut MultiHasher) {
    if !h.is_null() {
        // SAFETY: `h` was produced by `Box::into_raw` in `sk_hasher_new` and is consumed here.
        drop(Box::from_raw(h));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hex(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{b:02x}")).collect()
    }

    #[test]
    fn empty_input_matches_known_vectors() {
        let d = hash_all(b"");
        assert_eq!(hex(&d.md5), "d41d8cd98f00b204e9800998ecf8427e");
        assert_eq!(hex(&d.sha1), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
        assert_eq!(
            hex(&d.sha256),
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
        assert_eq!(d.crc32, 0);
        assert_eq!(d.length, 0);
    }

    #[test]
    fn abc_matches_known_vectors() {
        let d = hash_all(b"abc");
        assert_eq!(hex(&d.md5), "900150983cd24fb0d6963f7d28e17f72");
        assert_eq!(hex(&d.sha1), "a9993e364706816aba3e25717850c26c9cd0d89d");
        assert_eq!(
            hex(&d.sha256),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
        assert_eq!(d.crc32, 0x352441c2);
        assert_eq!(d.length, 3);
    }

    #[test]
    fn fox_matches_known_vectors() {
        let d = hash_all(b"The quick brown fox jumps over the lazy dog");
        assert_eq!(hex(&d.md5), "9e107d9d372bb6826bd81d3542a419d6");
        assert_eq!(hex(&d.sha1), "2fd4e1c67a2d28fced849ee1bb76e7391b93eb12");
        assert_eq!(
            hex(&d.sha256),
            "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592"
        );
        assert_eq!(d.crc32, 0x414fa339);
    }

    #[test]
    fn chunked_updates_equal_one_shot() {
        let data: Vec<u8> = (0..1_000_003u32).map(|i| (i * 31 % 251) as u8).collect();
        let whole = hash_all(&data);
        for chunk in [1usize, 7, 64, 4096, 65_537, 1 << 20] {
            let mut h = MultiHasher::new();
            for part in data.chunks(chunk) {
                h.update(part);
            }
            assert_eq!(h.finalize(), whole, "chunk size {chunk}");
        }
    }

    #[test]
    fn serialised_layout_is_stable() {
        let d = hash_all(b"abc");
        let bytes = d.to_bytes();
        assert_eq!(bytes.len(), DIGEST_LEN);
        assert_eq!(&bytes[..MD5_LEN], &d.md5);
        assert_eq!(&bytes[MD5_LEN..MD5_LEN + SHA1_LEN], &d.sha1);
        let crc_at = MD5_LEN + SHA1_LEN + SHA256_LEN;
        assert_eq!(&bytes[crc_at..crc_at + 4], &0x352441c2u32.to_be_bytes());
        assert_eq!(&bytes[crc_at + 4..], &3u64.to_be_bytes());
    }

    #[test]
    fn c_abi_round_trip() {
        // SAFETY: every pointer below comes from sk_alloc/sk_hasher_new with matching sizes.
        unsafe {
            let h = sk_hasher_new();
            let input = b"The quick brown fox jumps over the lazy dog";
            let buf = sk_alloc(input.len());
            std::ptr::copy_nonoverlapping(input.as_ptr(), buf, input.len());
            sk_hasher_update(h, buf, 10);
            sk_hasher_update(h, buf.add(10), input.len() - 10);
            let out = sk_alloc(DIGEST_LEN);
            sk_hasher_finish(h, out);
            let got = std::slice::from_raw_parts(out, DIGEST_LEN).to_vec();
            assert_eq!(got, hash_all(input).to_bytes().to_vec());
            sk_free(buf, input.len());
            sk_free(out, DIGEST_LEN);
        }
    }

    #[test]
    fn null_pointers_are_ignored() {
        // SAFETY: the functions under test must tolerate null pointers.
        unsafe {
            sk_hasher_update(std::ptr::null_mut(), std::ptr::null(), 0);
            sk_hasher_finish(std::ptr::null_mut(), std::ptr::null_mut());
            sk_hasher_free(std::ptr::null_mut());
            sk_free(std::ptr::null_mut(), 0);
        }
        assert_eq!(sk_abi_version(), ABI_VERSION);
        assert_eq!(sk_digest_len() as usize, DIGEST_LEN);
    }
}
