import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Bucket
    const myBucket = new s3.Bucket(this, "cdk-ga-sample-s3");

    // Create OriginAccessIdentity
    const oai = new cloudfront.OriginAccessIdentity(this, "cdk-ga-sample-oai");

    // Create Policy and attach to mybucket
    const myBucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject"],
      principals: [
        new iam.CanonicalUserPrincipal(
          oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
      resources: [myBucket.bucketArn + "/*"],
    });
    myBucket.addToResourcePolicy(myBucketPolicy);

    // Create CloudFront WebDistribution
    new cloudfront.CloudFrontWebDistribution(this, "WebsiteDistribution", {
      viewerCertificate: {
        aliases: [],
        props: {
          cloudFrontDefaultCertificate: true,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: myBucket,
            originAccessIdentity: oai,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
            },
          ],
        },
      ],
      errorConfigurations: [
        {
          errorCode: 403,
          responsePagePath: "/index.html",
          responseCode: 200,
          errorCachingMinTtl: 0,
        },
        {
          errorCode: 404,
          responsePagePath: "/index.html",
          responseCode: 200,
          errorCachingMinTtl: 0,
        },
      ],
    });
  }
}
