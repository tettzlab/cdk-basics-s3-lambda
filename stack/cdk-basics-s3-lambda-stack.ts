import { Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { S3Lambda } from '../lib/s3-lambda'

export class CdkBasicsS3LambdaStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const s3Lambda = new S3Lambda(this, 'S3Lambda', {
      inputBucketProps: {
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
      },
      outputBucketProps: {
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
      },
    })

    new CfnOutput(this, 'S3LambdaFunction', {
      value: s3Lambda.lambdaFunc.functionArn,
    })
    new CfnOutput(this, 'S3LambdaInputBucket', {
      value: s3Lambda.inputBucket.bucketName,
    })
    new CfnOutput(this, 'S3LambdaOutputBucket', {
      value: s3Lambda.outputBucket.bucketName,
    })
  }
}
