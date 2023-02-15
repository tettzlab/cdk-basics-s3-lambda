import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib'
// import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Bucket, BucketEncryption, EventType, BlockPublicAccess } from 'aws-cdk-lib/aws-s3'
import { Architecture, Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { Construct } from 'constructs'

export class CdkBasicsS3LambdaStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const myBucket = new Bucket(this, 'mybucket', {
      encryption: BucketEncryption.UNENCRYPTED, // NOTICE!
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY, // NOTICE!
      autoDeleteObjects: true, // NOTICE!
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    })

    const myLambda = new Function(this, 'mylambda', {
      architecture: Architecture.X86_64,
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset('./lib/src/lambda'),
      handler: 'mylambda.handler',
      timeout: Duration.seconds(90),
      environment: {
        REGION: Stack.of(this).region,
        AZ: JSON.stringify(
          Stack.of(this).availabilityZones,
        ),
      },
    })
    myBucket.grantReadWrite(myLambda)
    // myLambda.role?.attachInlinePolicy(
    //   new Policy(this, 'myLambdaPolicy', {
    //     statements: [
    //       new PolicyStatement({
    //         effect: Effect.ALLOW,
    //         actions: [
    //           's3:ListBucket',
    //           's3:GetObject',
    //           's3:PutObject',
    //         ],
    //         resources: [
    //           myBucket.bucketArn,
    //           `${myBucket.bucketArn}/*`
    //         ],
    //       }),
    //     ],
    //   }),
    // )
    myLambda.addEventSource(new S3EventSource(myBucket, {
      events: [EventType.OBJECT_CREATED_PUT],
    }))

    new CfnOutput(this, 'myLambdaArn', {
      value: myLambda.functionArn,
    })
    new CfnOutput(this, 'myBucketArn', {
      value: myBucket.bucketArn,
    })
  }
}
