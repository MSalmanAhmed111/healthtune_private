import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient, EDocument, EDocumentIssuance } from '@entities';
import { Repository } from 'typeorm';
import { ApiMessageData } from '@types';
import { UpsertDocumentDto } from 'src/dto';
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
  ) { }

  async upsertDocument(reqBody: UpsertDocumentDto, userId: number): Promise<ApiMessageData> {
    const { documentId, documentName, type, description, images, fields, templateDocHash, status } = reqBody;
    console.log({ fields })
    const fieldIds = fields.map((f) => f.id);
    if (new Set(fieldIds).size !== fieldIds.length) {
      throw new BadRequestException('Field IDs must be unique');
    }
    console.log({ fields })
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
    }
    else {
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
      documentId, issuedToOrgCode, description, patientId, businessProductId, tagId, doctorId,
      fieldValues,
    });

    issuance = await this.edocumentIssuanceRepository.save(issuance);

    return {
      message: SuccessResponseMessages.successGeneral,
      data: issuance,
    };
  }
}
