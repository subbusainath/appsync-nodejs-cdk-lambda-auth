import { verify,wand } from "./layers/auth/nodejs/jsonVerify"

exports.handler = async(event: { authorizationToken: any }) => {
    
    console.log(`The Event From this handler =>> ${JSON.stringify(event)}`)

    const buff = Buffer.from(wand, 'base64')

    const decodedValue = buff.toString("utf-8")

    console.log(`Decoded from base64 to normal string ====> ${decodedValue}`)

    const { authorizationToken } = event
    
    console.log(`This the authorizationToken  =>  ${authorizationToken}`)

    const result: any = await verify(authorizationToken, decodedValue);
    
    console.log(`This is result from the verification :=>>>  ${result}`)
    const response = {
        isAuthorized: result && result.wantToAuthenticate && result.wantToAuthenticate === true
    }
    return response
}