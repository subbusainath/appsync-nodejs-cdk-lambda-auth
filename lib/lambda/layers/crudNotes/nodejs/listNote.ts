import { DynamoDB } from 'aws-sdk'
const doclient = new DynamoDB.DocumentClient()

const listNote =async () => {
    const params: any = {
        TableName: process.env.APPSYNC_TABLE
    }
    try {
        const data = await doclient.scan(params).promise()
        return data.Items
    } catch (error) {
        console.error(`${error} in the dynamodb`)
        return null
    }
}


export default listNote