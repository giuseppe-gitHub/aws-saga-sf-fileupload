import * as lambda from 'aws-lambda';
import * as aws from 'aws-sdk';
import { PutItemInput } from 'aws-sdk/clients/dynamodb';
import { ISaveFileDBInput, ISaveFileDBOutput } from '../models/dto-models';

const tableName = process.env.TABLE_NAME;
const dynamoClient = new aws.DynamoDB();

const handler: lambda.Handler<ISaveFileDBInput, ISaveFileDBOutput> = async (event: ISaveFileDBInput) =>
{

    if(!tableName){
        throw new Error('table name missing');
    }

    var input: PutItemInput = {
        TableName: tableName,
        Item: {
            fileName: { S: event.fileName },
            fileKey: { S: event.fileKey },
            contentType: {S: event.storeFileOutput.Payload.contentType}
        }
    };

    await dynamoClient.putItem(input).promise();
    return {
        fileKey: event.fileKey,
        fileName: event.fileName,
        contentType: event.storeFileOutput.Payload.contentType
    };
};

exports.handler = handler;