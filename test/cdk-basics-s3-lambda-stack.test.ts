import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as CdkApp from '../stack/cdk-basics-s3-lambda-stack'

describe('CdkBasicsS3LambdaStack', () => {
  const app = new cdk.App()
  const stack = new CdkApp.CdkBasicsS3LambdaStack(app, 'MyTestStack')

  test('should have 3 lambda functions.', () => {
    Template.fromStack(stack).resourceCountIs('AWS::Lambda::Function', 2)
  })
  test('should have 2 buckets.', () => {
    Template.fromStack(stack).resourceCountIs('AWS::S3::Bucket', 2)
  })
})
