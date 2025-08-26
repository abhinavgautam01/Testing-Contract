use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{ next_account_info, AccountInfo },
    pubkey::Pubkey,
    entrypoint::{ ProgramResult }, 
    entrypoint
};

#[derive(BorshDeserialize, BorshSerialize)]
struct DoubleContractData {
    number: u32
}


entrypoint!(process_instruction);
fn process_instruction (
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
)->ProgramResult {
    // let acc = next_account_info(&mut accounts.iter())?;
    let mut iter = accounts.iter();
    let data_account = next_account_info(&mut iter)?;
    
    let mut stored_data = DoubleContractData::try_from_slice(& data_account.data.borrow_mut())?;

    if stored_data.number == 0 {
        stored_data.number = 1;
    } else {
        stored_data.number = stored_data.number * 2;
    }

    stored_data.serialize(&mut *data_account.data.borrow_mut());

    Ok(())
}