import { test, expect } from "bun:test"
import { LiteSVM } from "litesvm";
import {
	PublicKey,
	Transaction,
	SystemProgram,
	Keypair,
	LAMPORTS_PER_SOL,
    TransactionInstruction,
} from "@solana/web3.js";

test("one transfer", () => {
	const svm = new LiteSVM();
    const contractKey = PublicKey.unique();
    svm.addProgramFromFile(contractKey, "./double_contract.so");
	const payer = new Keypair();
	svm.airdrop(payer.publicKey, BigInt(5 * LAMPORTS_PER_SOL));
	const blockhash = svm.latestBlockhash();
    const dataAccount = Keypair.generate();
	
	const ixs = [
		SystemProgram.createAccount({
			fromPubkey: payer.publicKey,
            newAccountPubkey: dataAccount.publicKey,
			space: 4,
			lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
            programId: contractKey
		}),
	];
	const tx = new Transaction();
	tx.recentBlockhash = blockhash;
	tx.add(...ixs);
    tx.feePayer = payer.publicKey;
	tx.sign(payer, dataAccount);
	svm.sendTransaction(tx);
    
    const balanceAfter = svm.getBalance(dataAccount.publicKey);
    expect(balanceAfter).toBe(svm.minimumBalanceForRentExemption(BigInt(4)));
    
    function double_it(){
        const ix2 = new TransactionInstruction ({
            keys: [
                {pubkey: dataAccount.publicKey, isSigner: false, isWritable: true},
            ],
            programId: contractKey,
            data: Buffer.from([])
        });
        
        const blockhash = svm.latestBlockhash();
        const tx2 = new Transaction();
        tx2.recentBlockhash = blockhash;
        tx2.feePayer = payer.publicKey;
        tx2.add(ix2);
        tx2.sign(payer);
        svm.sendTransaction(tx2);
        svm.expireBlockhash();
        
        // Debug: Check the data after each call
        const accountAfter = svm.getAccount(dataAccount.publicKey);
        console.log("Data after double_it call:", Array.from(accountAfter.data));
    }
    
    console.log("Initial data:", Array.from(svm.getAccount(dataAccount.publicKey).data));
    
    double_it();
    double_it();
    double_it();
    double_it();
    
    const newDataAccount = svm.getAccount(dataAccount.publicKey);
    console.log("Final data:", Array.from(newDataAccount.data));
    
    // Verify the final value is 8 (little-endian: [8, 0, 0, 0])
    expect(Array.from(newDataAccount.data)).toEqual([8, 0, 0, 0]);
});