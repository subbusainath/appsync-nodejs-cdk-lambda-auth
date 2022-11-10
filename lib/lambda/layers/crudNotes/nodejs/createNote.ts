import { DynamoDB } from 'aws-sdk';
const doclient = new DynamoDB.DocumentClient();
import Note from './Note';

const createNote = async(note: Note) => {
    const params: any = {
        TableName :  process.env.APPSYNC_TABLE,
        Item : note
    }

    try{
        await doclient.put(params).promise();
        return note;
    }catch(err){
        console.error(`Dynamodb Error : ${err}`)
        return null
    }
}

export default createNote
