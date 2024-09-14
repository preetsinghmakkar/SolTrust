use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct AdminsWithdrawalAccount {
    pub admin: Pubkey,
    pub balance: u64,
}

impl AdminsWithdrawalAccount {
    pub const LEN: usize = 8 + 32 + 8;
}
