import { DynamoDB } from 'aws-sdk'
const doclient = new DynamoDB.DocumentClient()


const updateNote = async(note: any) => {
    let params: any = {
        TableName: process.env.APPSYNC_TABLE,
        Key: {
            id: note.id
        },
        ExpressionAttributeValues: {},
        ExpressionAttributeNames: {},
        UpdateExpression: "",
        ReturnValues: "UPDATED_NEW"
    };

    let prefix = "set ";
    let attributes = Object.keys(note)
    for(let i=0; i<attributes.length;i++){
        let attribute = attributes[i]
        if (attribute != 'id'){
            params["UpdateExpression"] += prefix + "#" + attribute + "= :" + attribute;
            params["ExpressionAttributeValues"][":" + attribute] = note[attribute]
            params["ExpressionAttributeNames"]["#" + attribute] = attribute
            prefix = ", ";
        }
    }
    console.log("Update Params", params)
    try {
        await doclient.update(params).promise()
        return note
    } catch (error) {
        console.error(`${error} in the Dynamodb Error`)
        return null      
    }

}

export default updateNote