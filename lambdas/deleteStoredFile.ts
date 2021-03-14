import * as lambda from 'aws-lambda';
import * as aws from 'aws-sdk';
import { IStoreFileInput, IStoreFileOutput } from '../models/dto-models';
import { v4 as uuidv4 } from 'uuid';
import _ = require('lodash');


const bucketName = process.env.BUCKET_NAME;
const s3 = new aws.S3();

const handler: lambda.Handler<IStoreFileInput, boolean> = async (event: IStoreFileInput) =>
{
    if (!bucketName)
    {
        throw new Error('bucket name missing');
    }
    const objects = await s3.listObjectsV2({ Bucket: bucketName, Prefix: event.fileKey }).promise();
    if (!_.find(objects.Contents ?? [], obj => obj.Key === event.fileKey))
    {
        return true;
    }

    await s3.deleteObject({
        Bucket: bucketName,
        Key: event.fileKey,
    }).promise();


    return true;

};

exports.handler = handler;