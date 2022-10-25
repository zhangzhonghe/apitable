import { cellValueToImageSrc, getHostOfAttachment, IAttachmentValue, IImageSrcOption, isImage, isPdf, isWebp } from '@apitable/core';
import accept from 'attr-accept';
import mime from 'mime-types';
import { browser } from 'pc/common/browser';
import { byte2Mb } from 'pc/utils';
import IconImg from 'static/icon/datasheet/attachment/attachment_ img_small_placeholder_filled.png'; // img
import IconTxt from 'static/icon/datasheet/attachment/datasheet_img_attachment_ text_placeholder.png'; // txt
import IconZip from 'static/icon/datasheet/attachment/datasheet_img_attachment_compressed_placeholder.png'; // zip
import IconExcel from 'static/icon/datasheet/attachment/datasheet_img_attachment_excel_placeholder.png'; // excel
import IconOther from 'static/icon/datasheet/attachment/datasheet_img_attachment_other_placeholder.png'; // 其他
import IconPdf from 'static/icon/datasheet/attachment/datasheet_img_attachment_pdf_placeholder.png'; // pdf
import IconPpt from 'static/icon/datasheet/attachment/datasheet_img_attachment_ppt_placeholder.png'; // ppt
import IconAudio from 'static/icon/datasheet/attachment/datasheet_img_attachment_video_placeholder.png'; // 多媒体
import IconWord from 'static/icon/datasheet/attachment/datasheet_img_attachment_word_placeholder.png'; // word 图标

export enum FileType {
  Other,
  Image,
  Doc,
  Pdf,
  Media,
  Zip,
  Txt,
}

export enum DocType {
  Word,
  Excel,
  PPT,
}

export const NO_SUPPORT_IMG_MIME_TYPE = [
  'image/vnd.adobe.photoshop',
  'image/tiff',
  'image/vnd.dwg',
];

const WORD_MIME_TYPE = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  'application/vnd.ms-word.document.macroEnabled.12',
];

const PPT_MIME_TYPE = [
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.template',
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  'application/vnd.ms-powerpoint.addin.macroEnabled.12',
  'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  'application/vnd.ms-powerpoint.template.macroEnabled.12',
  'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
];

const EXCEL_MIME_TYPE = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel.template.macroEnabled.12',
  'application/vnd.ms-excel.addin.macroEnabled.12',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  'text/csv',
];

export const DOC_MIME_TYPE = [
  ...WORD_MIME_TYPE,
  ...EXCEL_MIME_TYPE,
  ...PPT_MIME_TYPE,
];

const MEDIA_TYPE = ['audio/*', 'video/*'];

// ts 后缀文件默认识别成了 video/mp2t 视频格式
const INVALID_MEDIA_TYPE = ['video/mp2t'];

const ZIPPED_TYPE = [
  'application/zip',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
];

interface IFileLikeProps {
  name: string;
  type: string;
}

export function isWhatFileType(file: IFileLikeProps) {
  const inferredType = mime.lookup(file.name);
  if (isImage(file)) {
    return FileType.Image;
  }
  if (isPdf(file)) {
    return FileType.Pdf;
  }
  if (accept(file, DOC_MIME_TYPE) || DOC_MIME_TYPE.includes(inferredType)) {
    return FileType.Doc;
  }
  if (accept(file, MEDIA_TYPE) && !INVALID_MEDIA_TYPE.includes(inferredType)) {
    return FileType.Media;
  }
  if (accept(file, ZIPPED_TYPE)) {
    return FileType.Zip;
  }
  if (accept(file, 'text/plain')) {
    return FileType.Txt;
  }
  return FileType.Other;
}

export function isDocType(file: IFileLikeProps) {
  const inferredType = mime.lookup(file.name);
  if (accept(file, WORD_MIME_TYPE) || WORD_MIME_TYPE.includes(inferredType)) {
    return DocType.Word;
  }
  if (accept(file, PPT_MIME_TYPE) || PPT_MIME_TYPE.includes(inferredType)) {
    return DocType.PPT;
  }
  if (accept(file, EXCEL_MIME_TYPE) || EXCEL_MIME_TYPE.includes(inferredType)) {
    return DocType.Excel;
  }
  return '';
}

export function renderFileIconUrl(curFile: IFileLikeProps) {
  const type = isWhatFileType({ name: curFile.name, type: curFile.type });
  switch (type) {
    case FileType.Image: {
      return IconImg;
    }
    case FileType.Media: {
      return IconAudio;
    }
    case FileType.Doc: {
      const docType = isDocType(curFile);
      if (docType === DocType.Word) {
        return IconWord;
      }
      if (docType === DocType.Excel) {
        return IconExcel;
      }
      if (docType === DocType.PPT) {
        return IconPpt;
      }
      return IconOther;
    }
    case FileType.Pdf: {
      return IconPdf;
    }
    case FileType.Zip: {
      return IconZip;
    }
    case FileType.Txt: {
      return IconTxt;
    }
    case FileType.Other:
    default: {
      return IconOther;
    }
  }
}

export const imageSizeExceeded = (size: number) => {
  const MAX_FILE_SIZE = 20;
  return byte2Mb(size) >= MAX_FILE_SIZE;
};

/**
 * 是否要显示原图的缩略图，比如说体积超过 20Mb 后，就不显示
 */
export const showOriginImageThumbnail = (file: IAttachmentValue) => {
  const fileArgument = { name: file.name, type: file.mimeType };
  return (
    isPdf(fileArgument) ||
    (
      isImage(fileArgument) &&
      !imageSizeExceeded(file.size) &&
      isSupportImage(file.mimeType)
    )
  );
};

export const isSupportImage = (mimeType: string) => {
  return !NO_SUPPORT_IMG_MIME_TYPE.includes(mimeType);
};

// 获取文件的预览图
// 1. 图片、PDF 显示图片
// 2. 其它文件类型显示对应的 Icon
export const getCellValueThumbSrc = (
  file: IAttachmentValue,
  option: IImageSrcOption,
) => {
  let imgSrc = '';
  if (!file) {
    return imgSrc;
  }

  if (showOriginImageThumbnail(file)) {
    const transformWebpIfNeeded =
      (isWebp({ name: file.name, type: file.mimeType }) &&
        browser.satisfies({
          safari: '<14',
        })) ||
      browser.is('iOS');

    imgSrc = cellValueToImageSrc(file, {
      ...option,
      isPreview: true,
      formatToJPG: transformWebpIfNeeded ? true : option.formatToJPG,
    });
  } else {
    imgSrc = renderFileIconUrl({ name: file.name, type: file.mimeType }).src;
  }
  return imgSrc;
};

export function getDownloadSrc(fileInfo: IAttachmentValue) {
  const host = getHostOfAttachment(fileInfo.bucket);
  return `${host}${fileInfo.token}?attname=${encodeURIComponent(fileInfo.name)}`;
}

export function getAvInfoRequestUrl(fileInfo: IAttachmentValue) {
  const host = getHostOfAttachment(fileInfo.bucket);
  return `${host}${fileInfo.token}?avinfo`;
}
