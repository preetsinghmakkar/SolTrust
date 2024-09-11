// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { SolTrust } from "../target/types/sol_trust";
// import { Keypair, PublicKey } from "@solana/web3.js";

// describe("sol-trust", () => {
//   anchor.setProvider(anchor.AnchorProvider.env());

//   const program = anchor.workspace.SolTrust as Program<SolTrust>;

//   it("Is initialized!", async () => {
//     const tx = await program.methods
//       .initializeSoltrustConfig(new anchor.BN(1), new anchor.BN(1000))
//       .rpc();
//     console.log("Your transaction signature", tx);
//   });
// });

/////////Second One////////////////////////////

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolTrust } from "../target/types/sol_trust";
import { Keypair, PublicKey } from "@solana/web3.js";

describe("sol-trust", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolTrust as Program<SolTrust>;

  // Create the admin keypair (this should match the one used in your program)
  const adminKeypair = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([
      236, 80, 202, 29, 108, 93, 60, 166, 32, 159, 20, 143, 219, 66, 78, 8, 88,
      241, 128, 37, 95, 95, 159, 217, 68, 144, 80, 179, 7, 61, 21, 12, 230, 99,
      143, 181, 243, 42, 75, 81, 145, 153, 83, 95, 32, 240, 19, 51, 193, 207,
      79, 246, 230, 79, 18, 28, 73, 0, 241, 56, 158, 215, 86, 56,
    ])
  );

  // Fund the admin account with some SOL
  before(async () => {
    const airdropSig = await provider.connection.requestAirdrop(
      adminKeypair.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
  });

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
