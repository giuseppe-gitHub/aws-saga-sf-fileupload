

export interface IStoreFileInput {
    content: string;
    fileKey: string;
}

export interface IStoreFileOutput {
    contentType: string;
}

export interface IBaseSaveFileDBInput {
    fileName: string;

    fileKey: string;
}

export interface ISaveFileDBInput extends IBaseSaveFileDBInput {
    storeFileOutput: {
        Payload: IStoreFileOutput 
    } 
}

export interface ISaveFileDBOutput extends IBaseSaveFileDBInput, IStoreFileOutput {}

export interface IStepFunctionInput extends IStoreFileInput, IBaseSaveFileDBInput {} 
