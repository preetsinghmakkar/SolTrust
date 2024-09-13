import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolTrust } from "../target/types/sol_trust";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("sol-trust", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolTrust as Program<SolTrust>;

  it("Is initialized by admin!", async () => {
    const configIndex = 0;
    const depositFee = 1000;

    const [configPDA, _bump] = await PublicKey.findProgramAddress(
      [Buffer.from([configIndex]), Buffer.from("soltrust_config")], // Your seed logic
      program.programId
    );

    console.log("Client-side config PDA:", configPDA.toBase58());

    // Call the initializeSoltrustConfig instruction and pass the admin keypair as the signer
    const tx = await program.methods
      .initializeSoltrustConfig(
        new anchor.BN(configIndex),
        new anchor.BN(depositFee)
      )
      .accounts({
        owner: program.provider.publicKey, // Admin as the owner
        soltrustconfig: configPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Your transaction signature:", tx);

    // Fetch the SolTrustConfig account data
    const solTrustConfigAccount = await program.account.solTrustConfig.fetch(
      configPDA
    );

    // Check if the values are set correctly
    expect(solTrustConfigAccount.configIndex).to.equal(configIndex);
    expect(solTrustConfigAccount.depositFee).to.equal(depositFee);
    expect(solTrustConfigAccount.owner.toBase58()).to.equal(
      program.provider.publicKey.toBase58()
    );

    console.log("Account data after initialization:", solTrustConfigAccount);
  });

  it("Is Updating Working Right? ", async () => {
    const configIndex = 0;
    const depositFee = 1000;

    const [configPDA, _bump] = await PublicKey.findProgramAddress(
      [Buffer.from([configIndex]), Buffer.from("soltrust_config")], // Your seed logic
      program.programId
    );

    console.log("Client-side config PDA:", configPDA.toBase58());

    // Call the initializeSoltrustConfig instruction and pass the admin keypair as the signer
    const tx = await program.methods
      .initializeSoltrustConfig(
        new anchor.BN(configIndex),
        new anchor.BN(depositFee)
      )
      .accounts({
        owner: program.provider.publicKey, // Admin as the owner
        soltrustconfig: configPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const update = await program.methods
      .updateSoltrustConfig(new anchor.BN(1), new anchor.BN(100))
      .accounts({
        owner: program.provider.publicKey, // Admin as the owner
        soltrustconfig: configPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(update);
  });
});
