use crate::errors::ErrorCode;
use crate::{constants::*, CreateBankAccounts};
use crate::{sol_trust_config::*, AdminsWithdrawalAccount};
use anchor_lang::prelude::*;

pub fn withdraw_money(_ctx: Context<WithdrawMoney>, amount: u64, _name: String) -> Result<()> {
    let create_bank_account = &mut _ctx.accounts.create_bank_account;
    let signer = _ctx.accounts.signer.key();
    let withdrawer = &mut _ctx.accounts.signer;

    // Check if the account is authorized
    create_bank_account.is_account_authorized(signer)?;

    // The `amount` is already in lamports
    let lamports = amount;

    require!(
        create_bank_account.balance >= lamports,
        ErrorCode::InvalidAmount
    );

    // Calculate fee (0.1% of the withdrawal amount)
    let fee = (lamports as f64 * 0.001) as u64;
    let amount_after_fee = lamports - fee;
    let admin_withdrawal_account = &mut _ctx.accounts.admin_withdraw_account;

    // Transfer the fee to the admin account
    **create_bank_account
        .to_account_info()
        .try_borrow_mut_lamports()? -= fee;
    **admin_withdrawal_account
        .to_account_info()
        .try_borrow_mut_lamports()? += fee;

    admin_withdrawal_account.balance += fee;

    //Transferring Money after deducting fee to the withdrawer
    **create_bank_account
        .to_account_info()
        .try_borrow_mut_lamports()? -= amount_after_fee;
    **withdrawer.to_account_info().try_borrow_mut_lamports()? += amount_after_fee;

    // **Update the bank account's balance**
    create_bank_account.balance -= lamports;

    Ok(())
}

/////////Third Stage//////////////////////?
// pub fn withdraw_money(_ctx: Context<WithdrawMoney>, amount: u64, _name: String) -> Result<()> {
//     let create_bank_account = &mut _ctx.accounts.create_bank_account;
//     let signer = _ctx.accounts.signer.key();
//     let withdrawer = &mut _ctx.accounts.signer;

//     // Check if the account is authorized
//     create_bank_account.is_account_authorized(signer)?;

//     let lamports = amount; // The `amount` is in lamports
//     require!(
//         create_bank_account.balance >= lamports,
//         ErrorCode::InvalidAmount
//     );

//     // Calculate fee (0.1% of withdrawal amount)
//     let fee = (lamports as f64 * 0.001) as u64;
//     let amount_after_fee = lamports - fee;

//     let admin_withdrawal_account = &mut _ctx.accounts.admin_withdraw_account;

//     // Debugging outputs
//     msg!("Withdrawal requested: {}", lamports);
//     msg!("Fee calculated: {}", fee);
//     msg!("Amount after fee: {}", amount_after_fee);
//     msg!(
//         "Initial Bank Account Balance: {}",
//         create_bank_account.balance
//     );

//     // Transfer fee to the admin account
//     **create_bank_account
//         .to_account_info()
//         .try_borrow_mut_lamports()? -= fee;
//     **admin_withdrawal_account
//         .to_account_info()
//         .try_borrow_mut_lamports()? += fee;
//     admin_withdrawal_account.balance += fee;

//     // Transfer money after fee to the withdrawer
//     **create_bank_account
//         .to_account_info()
//         .try_borrow_mut_lamports()? -= amount_after_fee;
//     **withdrawer.to_account_info().try_borrow_mut_lamports()? += amount_after_fee;

//     // Update bank account balance
//     create_bank_account.balance -= lamports; // Corrected to reduce lamports

//     // Verifying transfers
//     let bank_lamports = **create_bank_account.to_account_info().lamports.borrow();
//     let admin_lamports = **admin_withdrawal_account.to_account_info().lamports.borrow();
//     let signer_lamports = **withdrawer.to_account_info().lamports.borrow();

//     msg!(
//         "Updated Bank Account Balance: {}",
//         create_bank_account.balance
//     );
//     msg!("Bank PDA Lamports after transfer: {}", bank_lamports);
//     msg!("Admin PDA Lamports after fee transfer: {}", admin_lamports);
//     msg!("Signer Lamports after transfer: {}", signer_lamports);

//     Ok(())
// }

#[derive(Accounts)]
#[instruction(amount: u16)]
pub struct WithdrawMoney<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // The person who is withdrawing the money

    pub soltrustconfig: Box<Account<'info, SolTrustConfig>>,

    #[account(
        mut,
        seeds = [&signer.key().to_bytes(), CREATE_BANK_ACCOUNT.as_bytes()],
        bump,
    )]
    pub create_bank_account: Account<'info, CreateBankAccounts>, // The PDA account that receives the SOL

    #[account(
        mut,
        seeds = [ADMIN_WITHDRAWAL_ACCOUNT.as_ref()],
        bump,
    )]
    pub admin_withdraw_account: Box<Account<'info, AdminsWithdrawalAccount>>, // Admin account to collect the fee

    pub system_program: Program<'info, System>, // System program required for SOL transfer
}
