import { CfnOutput, Stack, StackProps, RemovalPolicy, Duration} from 'aws-cdk-lib';
import { Construct  } from "constructs" 
import {CfnGraphQLApi,CfnGraphQLSchema, CfnDataSource, CfnResolver,} from 'aws-cdk-lib/aws-appsync'
import {Function,Code,Runtime, LayerVersion} from 'aws-cdk-lib/aws-lambda'
import { readFileSync } from 'fs';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Table,BillingMode,AttributeType } from "aws-cdk-lib/aws-dynamodb"
import { LambdaAuthorizerStack } from './lambda-authorizer-nested-resource';

export class AppsyncNodejsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const apiUserName = this.node.tryGetContext('user-name')
    const dbTableName = `${apiUserName}-notes-appsync-table`

    const { lambdaAuth } = new LambdaAuthorizerStack(this, "AppSync-lambda-authorizer")

    // appsync Table creation part
    const notesTable = new Table(this,`CDKNotesTable-${apiUserName}`,{
      tableName: dbTableName,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
          name: 'id',
          type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY
    })

    console.log(`This is inside the dynamodb stack --->   ${notesTable}`)

    // cloudwatch logs for Appsync

    const cloudWatchLogsRole = new Role(this,"AppSyncCloudWatchRole",{
      roleName: `${apiUserName}CloudWatchRoleForAppSync`,
      assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [ ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')]
    })

    // creating appsync api
    const  notesApi = new CfnGraphQLApi(this, 'NotesApiTesting',{
      authenticationType: "AWS_LAMBDA",
      name: `${apiUserName}-notes-appsync-endp`,
      xrayEnabled: true,
      lambdaAuthorizerConfig: {
        authorizerResultTtlInSeconds: 5,
        authorizerUri: lambdaAuth.functionArn
      },
      logConfig: {
        cloudWatchLogsRoleArn: cloudWatchLogsRole.roleArn,
        excludeVerboseContent: false,
        fieldLogLevel: "ERROR"
      }
    })


  // SCHEMA
    const  notesSchema = new CfnGraphQLSchema(this,'NotesSchema', {
      apiId: notesApi.attrApiId,
      definition: readFileSync('lib/graphql-schema/schema.graphql').toString()
    })

    // Lambda Layer for adding resolvers inside the lambda function
    const resolverLayer = new LayerVersion(this,'notes-resolver-layer',{
      compatibleRuntimes: [
        Runtime.NODEJS_14_X,
        Runtime.NODEJS_16_X
      ],
      code: Code.fromAsset("lib/lambda/layers/crudNotes/"),
      description: "Added CRUD Resolver codes for this lambda to use it"
    })

  

    const notesLambda = new Function(this,"AppsyncNoteLambda",{
      functionName: `${apiUserName}-main-notes-lambda`,
      runtime: Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: Code.fromAsset('lib/lambda/'),
      memorySize:1024,
      timeout: Duration.seconds(60),
      layers: [resolverLayer]
    })

    // Lambda Roles
    const invokeLambdaRole = new Role(this,"appsync-lambdaInvoke",{
      assumedBy: new ServicePrincipal("appsync.amazonaws.com")
    })

    invokeLambdaRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [notesLambda.functionArn],
      actions: ["lambda:InvokeFunction"]
    }))

    // authorizer Role
    const allowAppSyncPolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["lambda:InvokeFunction"],
      resources: [
        "arn:aws:iam::*:role/aws-service-role/appsync.amazonaws.com/AWSServiceRoleForAppSync",
      ],
    });

    // for datasource for the gql 
    const lambdaDs = new CfnDataSource(this,"NotesLambdaDatasource",{
      apiId: notesApi.attrApiId,
      name: `${apiUserName}LambdaDatasource`,
      type: "AWS_LAMBDA",
      lambdaConfig: {
        lambdaFunctionArn: notesLambda.functionArn
      },
      serviceRoleArn: invokeLambdaRole.roleArn
    })

    lambdaAuth.addToRolePolicy(allowAppSyncPolicyStatement)
    lambdaAuth.addPermission("subbu-appsync",{
     principal:  new ServicePrincipal("appsync.amazonaws.com"),
     action: "lambda:InvokeFunction"
    })

    console.log(`NotesApi -->   ${notesApi}`)
    console.log(`data source ->   ${lambdaDs}`)

    // resolvers creation 
    const getNotesByIdResolver = new CfnResolver(this,"getNotesResolver",{
      apiId: notesApi.attrApiId,
      typeName: "Query",
      fieldName: "getNoteById",
      dataSourceName: lambdaDs.name
    })

    const listNotesResolver = new CfnResolver(this,"listNotesResolver",{
      apiId: notesApi.attrApiId,
      typeName: "Query",
      fieldName: "listNotes",
      dataSourceName: lambdaDs.name
    })

    const createNoteResolver = new CfnResolver(this,"createNoteResolver",{
      apiId: notesApi.attrApiId,
      typeName: "Mutation",
      fieldName: "createNote",
      dataSourceName: lambdaDs.name
    })

    const deleteNoteResolver = new CfnResolver(this,"deleteNoteResolver",{
      apiId: notesApi.attrApiId,
      typeName: "Mutation",
      fieldName: "deleteNote",
      dataSourceName: lambdaDs.name
    })

    const updateNoteResolver = new CfnResolver(this,"updateNoteResolver",{
      apiId: notesApi.attrApiId,
      typeName: "Mutation",
      fieldName: "updateNote",
      dataSourceName: lambdaDs.name
    })

    // adding api dependcy to datasource 
    lambdaDs.addDependsOn(notesApi)

    // adding schema to the resolve as a dependency
    getNotesByIdResolver.addDependsOn(notesSchema)
    listNotesResolver.addDependsOn(notesSchema)
    createNoteResolver.addDependsOn(notesSchema)
    deleteNoteResolver.addDependsOn(notesSchema)
    updateNoteResolver.addDependsOn(notesSchema)

    // db access for the lambda 
    notesTable?.grantFullAccess(notesLambda)

    // adding table as a env inside the lambda as a dependency
    notesLambda.addEnvironment('APPSYNC_TABLE', notesTable?.tableName)

    // Prints the resource outputs
    new CfnOutput(this,"GraphqlUrl", {
      value: notesApi.attrGraphQlUrl
    })

    // prints the resource lambda name of the resolvers
    new CfnOutput(this,"lambdaResolvers",{
      value: notesLambda.functionName
    })

    // prints the resource role
    new CfnOutput(this,`${apiUserName}-resource-role-op`,{
      value: invokeLambdaRole.roleName
    })

     // Appsync table creation output
    new CfnOutput(this,`${apiUserName}-appsync-table-op`,{
      value: notesTable.tableName
    })
  }
}
