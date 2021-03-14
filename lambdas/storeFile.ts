import * as lambda from 'aws-lambda';
import * as aws from 'aws-sdk';
import { IStoreFileInput, IStoreFileOutput } from '../models/dto-models';
import { v4 as uuidv4 } from 'uuid';


const bucketName = process.env.BUCKET_NAME;
const s3 = new aws.S3();

const handler: lambda.Handler<IStoreFileInput, IStoreFileOutput> = async (event: IStoreFileInput) =>
{
    if (!bucketName)
    {
        throw new Error('bucket name missing');
    }

    await s3.putObject({
        Bucket: bucketName,
        Key: event.fileKey,
        Body: event.content,
        ContentType: 'text/plain'
    }).promise();


    return {
        contentType: 'text/plain'
    };

};

exports.handler = handler;