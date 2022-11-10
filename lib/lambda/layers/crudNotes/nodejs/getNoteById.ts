import { DynamoDB } from 'aws-sdk'
const doclient = new DynamoDB.DocumentClient()

const getNoteById = async(noteId: string) => {
    const params: any = {
        TableName: process.env.APPSYNC_TABLE,
        Key: {
            id: noteId
        }
    }
    try {
        const { Item } = await doclient.get(params).promise()
        return Item
    } catch (error) {
        console.error(`${error} -> in the dynamodb Error`)
        return null       
    }
}

export default getNoteById