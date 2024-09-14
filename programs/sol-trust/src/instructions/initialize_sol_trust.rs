use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::ErrorCode;
use crate::sol_trust_config::*;


pub fn initialize_soltrust_config(
    _ctx: Context<InitializeSolTrust>,
    config_index: u8,
) -> Result<()> {
    msg!("Index Config : {}", config_index);

    let sol_trust_config = &mut _ctx.accounts.soltrustconfig;
    sol_trust_config.config_index = config_index;
    sol_trust_config.owner = _ctx.accounts.owner.key();

    Ok(())
}

#[derive(Accounts)]
#[instruction(config_index : u8, deposit_fee : u16)]
pub struct InitializeSolTrust<'info> {
    // Address to be set as the owner.
    #[account(mut,
        address = crate::admin::id() @ ErrorCode::NotApproved)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        seeds= [&config_index.to_be_bytes(), SOLTRUST_CONFIG_SEED.as_bytes()], 
        bump, 
        space = SolTrustConfig::LEN)]

    pub soltrustconfig: Account<'info, SolTrustConfig>,

    pub system_program: Program<'info, System>,
}
