//! Reference skeleton for Assignment 1 — MPSC ring + future CapToken ABI.
//! Host Brain remains logical kernel until this guest is wired (V1.5+).

use std::sync::atomic::{AtomicU64, Ordering};

#[repr(u32)]
pub enum ErrCode {
    Ok = 0,
    Busy = 4,
}

#[repr(C, align(64))]
struct HeadPad {
    head: AtomicU64,
    _pad: [u8; 56],
}

#[repr(C, align(64))]
struct TailPad {
    tail: AtomicU64,
    _pad: [u8; 56],
}

pub struct MpscRing<const N: usize> {
    head: HeadPad,
    tail: TailPad,
}

impl<const N: usize> MpscRing<N> {
    pub const fn new() -> Self {
        Self {
            head: HeadPad {
                head: AtomicU64::new(0),
                _pad: [0; 56],
            },
            tail: TailPad {
                tail: AtomicU64::new(0),
                _pad: [0; 56],
            },
        }
    }

    /// Claim-only probe — payload path lands in V1.5 host shim.
    pub fn try_claim(&self) -> Result<u64, ErrCode> {
        assert!(N.is_power_of_two());
        let t = self.tail.tail.fetch_add(1, Ordering::Relaxed);
        let h = self.head.head.load(Ordering::Acquire);
        if t.wrapping_sub(h) as usize >= N {
            return Err(ErrCode::Busy);
        }
        Ok(t)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ring_claims_slots_until_full() {
        const N: usize = 4;
        let ring = MpscRing::<N>::new();
        for _ in 0..N {
            assert!(ring.try_claim().is_ok());
        }
        assert!(matches!(ring.try_claim(), Err(ErrCode::Busy)));
    }
}
