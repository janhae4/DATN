import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateLabelDto } from './create-label.dto';

// Không cho phép thay đổi projectId của label
export class UpdateLabelDto extends PartialType(
  OmitType(CreateLabelDto, ['projectId']),
) {}
