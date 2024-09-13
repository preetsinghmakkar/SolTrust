use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct CreateBankAccounts {
    pub holder: Pubkey,
    pub holder_name: String,
    pub thread_id: Vec<u8>,
    pub balance: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

impl CreateBankAccounts {
    pub const LEN: usize = 8 + 32 + 32 + 64 + 32 + 1 + 1 + 8;

    pub fn is_account_authorized<'info>(&self, signer: &Signer<'info>) -> Result<()> {
        require!(signer.key() == self.holder, ErrorCode::NotApproved);
        Ok(())
    }
}
