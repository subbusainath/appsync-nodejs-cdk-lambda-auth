import { NestedStack, NestedStackProps, CfnOutput, Duration } from 'aws-cdk-lib'
import { Function, Code, Runtime, LayerVersion} from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

export class LambdaAuthorizerStack extends NestedStack{
    readonly lambdaAuth: Function
    constructor(scope: Construct, id: string, props?: NestedStackProps){
        super(scope,id,props)

        // context we get from external;
        const userName = this.node.tryGetContext("user-name")

          // Lambda Layer for Auth Lambda inside the lambda function
        const authLayer = new LayerVersion(this,'auth-layer',{
            compatibleRuntimes: [
            Runtime.NODEJS_14_X,
            Runtime.NODEJS_16_X
            ],
            code: Code.fromAsset("lib/lambda/layers/auth/"),
            description: "Added Auth Layer Dep for its modules"
        })

        this.lambdaAuth = new Function(this,`lambda-auth-${userName}`,{
            functionName: `${userName}LambdaAuthorizer`,
            runtime: Runtime.NODEJS_14_X,
            code: Code.fromAsset('lib/lambda/'),
            handler: 'appsync-auth.handler',
            memorySize: 1024,
            timeout: Duration.seconds(30),
            layers: [authLayer]
        })

        // lambda auth creation cfn output
        new CfnOutput(this,`${userName}-appsync-lambda-auth-op`,{
            value: this.lambdaAuth.functionName
          })
    }
}