use anchor_lang::prelude::*;
use crate::{constants::*, AdminsWithdrawalAccount};
use crate::errors::ErrorCode;


pub fn initialize_admin_withdrawal_account(
    _ctx: Context<AdminWithdrawalAccount>,
) -> Result<()> {

    let admin_withdrawal_account = &mut _ctx.accounts.admin_withdrawal_account;
    admin_withdrawal_account.admin = _ctx.accounts.admin.key();
    admin_withdrawal_account.balance = 0;

    Ok(())
}

#[derive(Accounts)]
#[instruction(config_index : u8, deposit_fee : u16)]
pub struct AdminWithdrawalAccount<'info> {
    // Address to be set as the owner.
    #[account(mut,
        address = crate::admin::id() @ ErrorCode::NotApproved)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        seeds= [ADMIN_WITHDRAWAL_ACCOUNT.as_ref()], 
        bump, 
        space = AdminsWithdrawalAccount::LEN)]
    pub admin_withdrawal_account: Account<'info, AdminsWithdrawalAccount>,

    pub system_program: Program<'info, System>,
}
