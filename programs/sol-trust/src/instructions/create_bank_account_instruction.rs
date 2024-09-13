use anchor_lang::prelude::*;
use crate::{constants::*, CreateBankAccounts, SolTrustConfig};


pub fn create_bank_account(
    _ctx: Context<CreateBankAccount>,
    name: String,
) -> Result<()> {
   

   let clock = Clock::get()?;

   let create_bank_account = &mut _ctx.accounts.create_bank_account;

  
create_bank_account.holder = _ctx.accounts.signer.key();
create_bank_account.balance = 0;
create_bank_account.holder_name = name;
create_bank_account.created_at = clock.unix_timestamp;
create_bank_account.updated_at = clock.unix_timestamp;

msg!("Created At :  {clock.unix_timestamp}");


    Ok(())
}


#[derive(Accounts)]
#[instruction(name : String)]
pub struct CreateBankAccount<'info> {
    // Address to be set as the owner.
    #[account(mut)]
    pub signer: Signer<'info>,

    /// Which config the Bank belongs to.
    pub soltrustconfig: Box<Account<'info, SolTrustConfig>>,

    #[account(
        init,
        payer = signer,
        seeds= [&name.as_ref(), CREATE_BANK_ACCOUNT.as_bytes()], 
        bump, 
        space = 8 + CreateBankAccounts::LEN)]

    pub create_bank_account: Account<'info, CreateBankAccounts>,

    pub system_program: Program<'info, System>,
}

