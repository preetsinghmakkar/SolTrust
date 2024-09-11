use anchor_lang::prelude::*;
pub mod errors;

use crate::errors::ErrorCode;

declare_id!("8Go6TspKm3rMV3N4ueARF8MqptuBAEP5H7iDP7XLSMcX");

pub mod admin {
    use anchor_lang::prelude::declare_id;
    #[cfg(feature = "devnet")]
    declare_id!("58KP8zx3yTLwa7tvT2dJdiG7n7uQKgTGDvhr3fV21z8a");
    #[cfg(not(feature = "devnet"))]
    declare_id!("GWLpjnxVGQTBKHp9CD3rkgi76P2hxWoDkPTk5LBvtsDq");
}

pub const SOLTRUST_CONFIG_SEED: &str = "soltrust_config";

#[program]
pub mod sol_trust {
    use super::*;

    pub fn initialize_soltrust_config(
        _ctx: Context<Initialize>,
        config_index: u8,
        deposit_fee: u16,
    ) -> Result<()> {
        msg!("Deposit Fee : {}", deposit_fee);
        msg!("Index Config : {}", config_index);
        

        let sol_trust_config = &mut _ctx.accounts.soltrustconfig;
        sol_trust_config.config_index = config_index;
        sol_trust_config.deposit_fee = deposit_fee;
        sol_trust_config.owner = _ctx.accounts.owner.key();

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(config_index : u8, deposit_fee : u16)]
pub struct Initialize<'info> {
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

#[account]
#[derive(Default, Debug)]
pub struct SolTrustConfig {
    pub owner: Pubkey,
    pub config_index: u8,
    pub deposit_fee: u16,
}

impl SolTrustConfig {
    const LEN: usize = 8 + 32 + 1 + 2 + 8;

    pub fn is_authorized<'info>(&self, signer: &Signer<'info>) -> Result<()> {
        require!(signer.key() == self.owner, ErrorCode::NotApproved);
        Ok(())
    }
}
