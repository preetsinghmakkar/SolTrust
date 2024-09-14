use crate::constants::ADMIN_WITHDRAWAL_ACCOUNT;
use crate::errors::ErrorCode;
use crate::AdminsWithdrawalAccount;
use anchor_lang::prelude::*;

pub fn withdraw_fees(ctx: Context<WithdrawFees>, amount: u64) -> Result<()> {
    let admin_account = &mut ctx.accounts.admin_account;
    let admin = &mut ctx.accounts.admin;

    let lamports = amount * 1_000_000_000; // Amount in lamports

    // Ensure the admin has enough balance to withdraw
    require!(admin_account.balance >= lamports, ErrorCode::InvalidAmount);

    // Transfer lamports to the admin
    **admin_account.to_account_info().try_borrow_mut_lamports()? -= lamports;
    **admin.to_account_info().try_borrow_mut_lamports()? += lamports;

    // Update the admin account balance
    admin_account.balance -= lamports; // Subtract the withdrawn amount from the balance

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut,
        address = crate::admin::id() @ ErrorCode::NotApproved)]
    pub admin: Signer<'info>, // Admin withdrawing the fees

    #[account(
        mut,
        seeds = [ADMIN_WITHDRAWAL_ACCOUNT.as_ref()],
        bump,
    )]
    pub admin_account: Account<'info, AdminsWithdrawalAccount>, // The admin account holding the fees

    pub system_program: Program<'info, System>,
}
