use anchor_lang::prelude::*;

declare_id!("8Go6TspKm3rMV3N4ueARF8MqptuBAEP5H7iDP7XLSMcX");

#[program]
pub mod sol_trust {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
