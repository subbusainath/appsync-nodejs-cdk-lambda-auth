#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppsyncNodejsCdkStack } from '../lib/appsync-nodejs-cdk-stack';

const app = new cdk.App();
new AppsyncNodejsCdkStack(app, 'Subbu-NestedStacks')