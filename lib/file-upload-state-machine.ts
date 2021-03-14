import * as cdk from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as s3 from "@aws-cdk/aws-s3";
import * as lambda from "@aws-cdk/aws-lambda";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as tasks from "@aws-cdk/aws-stepfunctions-tasks";
import * as apigateway from "@aws-cdk/aws-apigateway";

export class FileUploadStateMachine extends cdk.Construct
{
    constructor(scope: cdk.Construct, id: string)
    {
        super(scope, id);

        const filesTable = new dynamodb.Table(this, 'FilesTable', {
            partitionKey: { name: 'fileName', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'fileKey', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        const filesStore = new s3.Bucket(this, 'FilesStore', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true
        });

        const storeFileLambda = this.createLambdaBucket(this, 'StoreFileLambda', 'storeFile.handler', filesStore.bucketName);
        filesStore.grantReadWrite(storeFileLambda);

        const deleteFileLambda = this.createLambdaBucket(this, 'DeleteFileLambda', 'deleteStoredFile.handler', filesStore.bucketName);
        filesStore.grantRead(deleteFileLambda);
        filesStore.grantDelete(deleteFileLambda);

        const saveFileInfoLambda = this.createLambdaTable(this, 'SaveFileInfoLambda', 'saveFileInfo.handler', filesTable);
        const deleteFileInfoLambda = this.createLambdaTable(this, 'DeleteFileInfoLambda', 'deleteFileInfo.handler', filesTable);



        const uploadFailed = new sfn.Fail(this, "Upload-Failed");
        const uploadSucceeded = new sfn.Succeed(this, "Upload-succes");

        const deleteFileInfoStep = new tasks.LambdaInvoke(this, 'DeleteFileInfoStep', {
            lambdaFunction: deleteFileInfoLambda,
            resultPath: '$.deleteFileInfoOutput'
        })
            .next(uploadFailed);

        const deleteFileStep = new tasks.LambdaInvoke(this, 'DeleteFileStep', {
            lambdaFunction: deleteFileLambda,
            resultPath: '$.deleteFileOutput'
        })
            .addRetry({ maxAttempts: 3 })
            .next(deleteFileInfoStep);


        const storeFileStep = new tasks.LambdaInvoke(this, 'StoreFileStep', {
            lambdaFunction: storeFileLambda,
            resultPath: '$.storeFileOutput'
        }).addCatch(deleteFileStep, {
            resultPath: '$.storeFileErrorOutput'
        });

        const saveFileInfoStep = new tasks.LambdaInvoke(this, 'SaveFileInfoStep', {
            lambdaFunction: saveFileInfoLambda,
            resultPath: '$.saveFileInfoOutput'
        }).addCatch(deleteFileStep, {
            resultPath: '$.saveFileInfoErrorOutput'
        })

        const stateMachineDef = sfn.Chain
        .start(storeFileStep)
        .next(saveFileInfoStep)
        .next(uploadSucceeded);

        
      let saga = new sfn.StateMachine(this, "SaveFileStateMachine", {
        definition: stateMachineDef
      });

        // AWS Lambda resource to connect to our API Gateway to kick
    // off our step function
    const sagaLambda = new lambda.Function(this, 'SagaLambdaHandler', {
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromAsset('lambdas'),
        handler: 'sagaLambda.handler',
        environment: {
          statemachine_arn: saga.stateMachineArn
        }
      });
  
      saga.grantStartExecution(sagaLambda);

      const api = new apigateway.RestApi(this, "FileUploadApi", {
        restApiName: "File upload service",
        description: "This service upload files."
      });
  
      const fileUploadIntegration = new apigateway.LambdaIntegration(sagaLambda);

      api.root.addMethod('POST', fileUploadIntegration);
    }


    private createLambdaTable(scope: cdk.Construct, id: string, handler: string, table: dynamodb.Table)
    {

        // Create a Lambda with the table name passed in as variable
        let fn = new lambda.Function(scope, id, {
            runtime: lambda.Runtime.NODEJS_12_X,
            code: lambda.Code.fromAsset('lambdas'),
            handler: handler,
            environment: {
                TABLE_NAME: table.tableName
            }
        });

        // Give Lambda permissions to read and write data from the DynamoDB table
        table.grantReadWriteData(fn);

        return fn;
    }

    private createLambdaBucket(scope: cdk.Construct, id: string, handler: string, bucketName: string)
    {

        // Create a Lambda with the table name passed in as variable
        let fn = new lambda.Function(scope, id, {
            runtime: lambda.Runtime.NODEJS_12_X,
            code: lambda.Code.fromAsset('lambdas'),
            handler: handler,
            environment: {
                BUCKET_NAME: bucketName
            }
        });

        return fn;
    }
}