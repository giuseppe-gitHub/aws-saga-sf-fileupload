import * as lambda from 'aws-lambda';
import * as aws from 'aws-sdk';
import { DeleteItemInput } from 'aws-sdk/clients/dynamodb';

import { ISaveFileDBInput, ISaveFileDBOutput } from '../models/dto-models';

const tableName = process.env.TABLE_NAME;
const dynamoClient = new aws.DynamoDB();

const handler: lambda.Handler<ISaveFileDBInput, ISaveFileDBOutput> = async (event: ISaveFileDBInput) =>
{

    if(!tableName){
        throw new Error('table name missing');
    }

    var input: DeleteItemInput = {
        TableName: tableName,
        Key: {
            fileName: { S: event.fileName },
            fileKey: { S: event.fileKey },
        },
        ConditionExpression: 'attribute_exists(fileKey)'
    };

    await dynamoClient.deleteItem(input).promise();
    return {
        fileKey: event.fileKey,
        fileName: event.fileName,
        contentType: event.storeFileOutput.Payload.contentType
    };
};

exports.handler = handler;