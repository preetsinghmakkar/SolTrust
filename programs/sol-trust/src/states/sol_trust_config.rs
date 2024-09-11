use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct SolTrustConfig {
    pub owner: Pubkey,
    pub config_index: u8,
    pub deposit_fee: u16,
}

impl SolTrustConfig {
    pub const LEN: usize = 8 + 32 + 1 + 2 + 8;

    pub fn is_authorized<'info>(&self, signer: &Signer<'info>) -> Result<()> {
        require!(signer.key() == self.owner, ErrorCode::NotApproved);
        Ok(())
    }
}
