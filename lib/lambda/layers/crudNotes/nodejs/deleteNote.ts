import { DynamoDB } from 'aws-sdk'
const doclient = new DynamoDB.DocumentClient()

const deleteNote = async(noteId: String) => {
    const params : any = {
        TableName: process.env.APPSYNC_TABLE,
        Key:{
            id: noteId
        }
    }

    try {
        await doclient.delete(params).promise()
        console.log(`${noteId} is deleted successfully`)
        return noteId
    } catch (error) {
        console.error(`${error} in the Dynamodb`)
        return null
    }
}

export default deleteNote