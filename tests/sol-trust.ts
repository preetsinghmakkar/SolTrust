import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolTrust } from "../target/types/sol_trust";
import { Keypair, PublicKey } from "@solana/web3.js";

describe("sol-trust", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolTrust as Program<SolTrust>;

  it("Is initialized by admin!", async () => {
    const [configPDA, _bump] = await PublicKey.findProgramAddress(
      [Buffer.from([1]), Buffer.from("soltrust_config")], // Your seed logic
      program.programId
    );

    console.log("Client-side config PDA:", configPDA.toBase58());

    // Call the initializeSoltrustConfig instruction and pass the admin keypair as the signer
    const tx = await program.methods
      .initializeSoltrustConfig(new anchor.BN(1), new anchor.BN(1000))
      .accounts({
        owner: program.provider.publicKey, // Admin as the owner
        soltrustconfig: configPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Your transaction signature", tx);
  });
});
