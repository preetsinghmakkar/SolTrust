use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct CreateBankAccounts {
    pub holder: Pubkey,
    pub holder_name: [u8; 32],
    pub balance: u64,
    pub created_at: i64,
}

impl CreateBankAccounts {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8;

    pub fn is_account_authorized<'info>(&self, signer: Pubkey) -> Result<()> {
        require!(signer == self.holder, ErrorCode::NotApproved);
        Ok(())
    }
}
