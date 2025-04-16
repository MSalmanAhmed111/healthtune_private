import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient, EDocument, EDocumentIssuance } from '@entities';
import { ILike, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination } from '@types';
import { GetAllIssuedDocumentsDto, PaginationQueryDto, UpsertDocumentDto } from 'src/dto';
import { EDocumentErrorMessages, PatientErrorMessages, SuccessResponseMessages } from '@messages';
import { UpsertDocumentIssuanceDto } from './dto/issue-document.dto';

@Injectable()
export class EDocumentService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(EDocument)
    private readonly edocumentRepository: Repository<EDocument>,
    @InjectRepository(EDocumentIssuance)
    private readonly edocumentIssuanceRepository: Repository<EDocumentIssuance>,
  ) {}

  async upsertDocument(reqBody: UpsertDocumentDto, userId: number): Promise<ApiMessageData> {
    const { documentId, documentName, type, description, images, fields, templateDocHash, status } = reqBody;
    console.log({ fields });
    const fieldIds = fields.map((f) => f.id);
    if (new Set(fieldIds).size !== fieldIds.length) {
      throw new BadRequestException('Field IDs must be unique');
    }
    console.log({ fields });
    let document: EDocument | null = null;
    if (documentId) document = await this.edocumentRepository.findOne({ where: { id: documentId } });

    if (document) {
      document.description = description || document.description;
      document.documentName = documentName || document.documentName;
      document.fields = fields || document.fields;
      document.images = images || document.images;
      document.status = status || document.status;
      document.templateDocHash = templateDocHash || document.templateDocHash;
      document.type = type || document.type;
    } else {
      document = this.edocumentRepository.create({
        documentName,
        type,
        description,
        images,
        fields,
        templateDocHash,
        status: status,
      });
    }
    console.log('document', document);
    document = await this.edocumentRepository.save(document);

    return { message: SuccessResponseMessages.successGeneral, data: document };
  }

  async getUpsertedDocument(docId: number, userId: number): Promise<ApiMessageData> {
    const document = await this.edocumentRepository.findOne({ where: { id: docId } });
    if (!document) throw new NotFoundException(EDocumentErrorMessages.edocumentNotExists);
    return { message: SuccessResponseMessages.successGeneral, data: document };
  }

  async getAllUpsertedDocuments(reqBody: PaginationQueryDto, userId: number): Promise<ApiMessageDataPagination> {
    const { page, limit, query } = reqBody;
    const whereCondition = query ? [{ documentName: ILike(`%${query}%`) }, { id: isNaN(Number(query)) ? undefined : Number(query) }] : undefined;
    const skip = (page - 1) * limit;
    const [document, total] = await this.edocumentRepository.findAndCount({ where: whereCondition, skip, take: limit, order: { id: 'DESC' } });
    const lastPage = Math.ceil(total / limit);
    return { message: SuccessResponseMessages.successGeneral, data: document, page, total, lastPage };
  }

  async issueDocument(upsertDocumentIssuanceDto: UpsertDocumentIssuanceDto, doctorId: number): Promise<ApiMessageData> {
    const { documentId, issuedToOrgCode, description, patientId, fieldValues, businessProductId, tagId } = upsertDocumentIssuanceDto;

    const document = await this.edocumentRepository.findOne({ where: { id: documentId } });
    if (!document) throw new NotFoundException(EDocumentErrorMessages.edocumentNotExists);

    if (patientId) {
      const patient = await this.patientRepository.findOne({ where: { id: patientId } });
      if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);
    }

    const templateFieldIds = document.fields.map((f) => f.id);
    const inputFieldIds = fieldValues.map((fv) => fv.fieldId);
    const invalidFields = inputFieldIds.filter((id) => !templateFieldIds.includes(id));
    if (invalidFields.length > 0) throw new BadRequestException(EDocumentErrorMessages.issuanceInvalidFields);

    if (new Set(inputFieldIds).size !== inputFieldIds.length) {
      throw new BadRequestException('Field IDs must be unique in fieldValues');
    }

    let issuance = this.edocumentIssuanceRepository.create({
      documentId,
      issuedToOrgCode,
      description,
      patientId,
      businessProductId,
      tagId,
      doctorId,
      fieldValues,
    });

    issuance = await this.edocumentIssuanceRepository.save(issuance);

    return {
      message: SuccessResponseMessages.successGeneral,
      data: issuance,
    };
  }

  async getIssuedDocument(docIssueId: number, userId: number): Promise<ApiMessageData> {
    const document = await this.edocumentIssuanceRepository.findOne({ where: { doctorId: userId, id: docIssueId } });
    if (!document) throw new NotFoundException(EDocumentErrorMessages.edocumentNotExists);
    return { message: SuccessResponseMessages.successGeneral, data: document };
  }

  async getAllIssuedDocuments(reqBody: GetAllIssuedDocumentsDto, userId: number): Promise<ApiMessageDataPagination> {
    const { page, limit, query, patientId, documentId } = reqBody;
    const commonWhereCondition: any = { doctorId: userId };
    if (patientId) commonWhereCondition.patientId = patientId;
    if (documentId) commonWhereCondition.documentId = documentId;
    const whereCondition = query
      ? [
          { document: { documentName: ILike(`%${query}%`) }, ...commonWhereCondition },
          { id: isNaN(Number(query)) ? undefined : Number(query), ...commonWhereCondition },
        ]
      : commonWhereCondition;
    const skip = (page - 1) * limit;
    const [document, total] = await this.edocumentIssuanceRepository.findAndCount({ where: whereCondition, skip, take: limit, order: { id: 'DESC' }, relations: ['document', 'patient'] });
    const lastPage = Math.ceil(total / limit);
    return { message: SuccessResponseMessages.successGeneral, data: document, page, total, lastPage };
  }
}
