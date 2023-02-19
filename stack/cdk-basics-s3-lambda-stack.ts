import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { S3Lambda } from './s3-lambda'

export class CdkBasicsS3LambdaStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const environment = this.node.tryGetContext('environment') ?? 'production'

    const s3Lambda = new S3Lambda(this, 'S3Lambda', {
      production: environment === 'production',
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
