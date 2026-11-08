//! Assignment 1+3 reference types — CapToken linear consume (host verifies MAC).
//! Not wired into apps/api yet; V1.5 target.

use std::collections::HashMap;

#[repr(u32)]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum ErrCode {
    Ok = 0,
    Denied = 3,
    Replay = 5,
    BadContract = 6,
}

#[repr(C)]
#[derive(Clone, Debug)]
pub struct CapToken {
    pub grant_id: u64,
    pub nonce: [u8; 16],
    pub mask: u64,
    pub expires_tick: u64,
    pub mac: [u8; 32],
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum TokenState {
    Fresh,
    Consumed,
    Expired,
}

pub struct TokenStore {
    states: HashMap<u64, TokenState>,
}

impl TokenStore {
    pub fn new() -> Self {
        Self {
            states: HashMap::new(),
        }
    }

    pub fn insert_fresh(&mut self, grant_id: u64) {
        self.states.insert(grant_id, TokenState::Fresh);
    }

    /// Linear consume: Fresh → Consumed. Replay → error.
    pub fn consume(&mut self, grant_id: u64) -> Result<(), ErrCode> {
        match self.states.get(&grant_id).copied() {
            Some(TokenState::Fresh) => {
                self.states.insert(grant_id, TokenState::Consumed);
                Ok(())
            }
            Some(TokenState::Consumed) | Some(TokenState::Expired) => Err(ErrCode::Replay),
            None => Err(ErrCode::Denied),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn no_replay() {
        let mut s = TokenStore::new();
        s.insert_fresh(1);
        assert!(s.consume(1).is_ok());
        assert_eq!(s.consume(1), Err(ErrCode::Replay));
    }
}
