# Documentação do Docling

## Instalação

Para usar o Docling, basta instalar o pacote via seu gerenciador Python, por exemplo, pip:

```bash
pip install docling
```

Funciona em macOS, Linux e Windows, com suporte para arquiteturas x86_64 e arm64.

### Distribuições alternativas do PyTorch

Os modelos do Docling dependem da biblioteca PyTorch. Dependendo da sua arquitetura, pode ser necessário usar uma distribuição diferente do torch, por exemplo, para suporte a diferentes aceleradores ou apenas CPU. Veja todas as opções de instalação em https://pytorch.org/.

Um caso comum é a instalação em sistemas Linux com suporte apenas a CPU. Sugerimos instalar o Docling com as opções abaixo:

```bash
# Exemplo para instalar no Linux com suporte apenas a CPU
pip install docling --extra-index-url https://download.pytorch.org/whl/cpu
```

## Motores OCR Alternativos

O Docling suporta múltiplos motores OCR para processar documentos digitalizados. A versão atual oferece os seguintes motores:

| Motor           | Instalação                                                                                  | Uso                        |
|-----------------|--------------------------------------------------------------------------------------------|----------------------------|
| EasyOCR         | Padrão no Docling ou via `pip install easyocr`.                                            | EasyOcrOptions             |
| Tesseract       | Dependência de sistema. Veja abaixo para Tesseract e Tesserocr.                            | TesseractOcrOptions        |
| Tesseract CLI   | Dependência de sistema. Veja abaixo.                                                       | TesseractCliOcrOptions     |
| OcrMac          | Dependência de sistema. Veja abaixo.                                                       | OcrMacOptions              |
| RapidOCR        | Recurso extra, instale via `pip install rapidocr_onnxruntime`                              | RapidOcrOptions            |
| OnnxTR          | Instale via plugin: `pip install "docling-ocr-onnxtr[cpu]"`                                | OnnxtrOcrOptions           |

O `DocumentConverter` do Docling permite escolher o motor OCR com a configuração `ocr_options`. Exemplo:

```python
from docling.datamodel.base_models import ConversionStatus, PipelineOptions
from docling.datamodel.pipeline_options import PipelineOptions, EasyOcrOptions, TesseractOcrOptions
from docling.document_converter import DocumentConverter

pipeline_options = PipelineOptions()
pipeline_options.do_ocr = True
pipeline_options.ocr_options = TesseractOcrOptions()  # Usar Tesseract

doc_converter = DocumentConverter(
    pipeline_options=pipeline_options,
)
```

## Instalação do Tesseract

O Tesseract é um motor OCR popular disponível na maioria dos sistemas operacionais. Para usá-lo com o Docling, instale o Tesseract no seu sistema usando o gerenciador de pacotes de sua escolha. Após instalar, defina o caminho dos arquivos de idioma usando a variável de ambiente `TESSDATA_PREFIX` (deve terminar com `/`).

### Exemplos de instalação

- **macOS (via Homebrew)**
- **Distribuições baseadas em Debian**
- **RHEL**

```bash
brew install tesseract leptonica pkg-config
TESSDATA_PREFIX=/opt/homebrew/share/tessdata/
echo "Set TESSDATA_PREFIX=${TESSDATA_PREFIX}"
```

### Vinculando ao Tesseract

O uso mais eficiente do Tesseract é via linkagem. O Docling utiliza o pacote Tesserocr para isso. Se tiver problemas na instalação do Tesserocr, tente:

```bash
pip uninstall tesserocr
pip install --no-binary :all: tesserocr
```

## Instalação do ocrmac

O ocrmac usa o framework Vision (ou LiveText) da Apple como backend OCR. Só funciona em sistemas macOS recentes (10.15+):

```bash
pip install ocrmac
```
Installation on macOS Intel (x86_64)
When installing Docling on macOS with Intel processors, you might encounter errors with PyTorch compatibility. This happens because newer PyTorch versions (2.6.0+) no longer provide wheels for Intel-based Macs.

If you're using an Intel Mac, install Docling with compatible PyTorch Note: PyTorch 2.2.2 requires Python 3.12 or lower. Make sure you're not using Python 3.13+.


# For uv users
uv add torch==2.2.2 torchvision==0.17.2 docling

# For pip users
pip install "docling[mac_intel]"

# For Poetry users
poetry add docling
Development setup
To develop Docling features, bugfixes etc., install as follows from your local clone's root dir:


uv sync --all-extras


##Usage
Conversion
Convert a single document
To convert individual PDF documents, use convert(), for example:


from docling.document_converter import DocumentConverter

source = "https://arxiv.org/pdf/2408.09869"  # PDF path or URL
converter = DocumentConverter()
result = converter.convert(source)
print(result.document.export_to_markdown())  # output: "### Docling Technical Report[...]"
CLI
You can also use Docling directly from your command line to convert individual files —be it local or by URL— or whole directories.


docling https://arxiv.org/pdf/2206.01062
You can also use 🥚SmolDocling and other VLMs via Docling CLI:

docling --pipeline vlm --vlm-model smoldocling https://arxiv.org/pdf/2206.01062
This will use MLX acceleration on supported Apple Silicon hardware.
To see all available options (export formats etc.) run docling --help. More details in the CLI reference page.

Advanced options
Model prefetching and offline usage
By default, models are downloaded automatically upon first usage. If you would prefer to explicitly prefetch them for offline use (e.g. in air-gapped environments) you can do that as follows:

Step 1: Prefetch the models

Use the docling-tools models download utility:


$ docling-tools models download
Downloading layout model...
Downloading tableformer model...
Downloading picture classifier model...
Downloading code formula model...
Downloading easyocr models...
Models downloaded into $HOME/.cache/docling/models.
Alternatively, models can be programmatically downloaded using docling.utils.model_downloader.download_models().

Step 2: Use the prefetched models


from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import EasyOcrOptions, PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

artifacts_path = "/local/path/to/models"

pipeline_options = PdfPipelineOptions(artifacts_path=artifacts_path)
doc_converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    }
)
Or using the CLI:


docling --artifacts-path="/local/path/to/models" FILE
Or using the DOCLING_ARTIFACTS_PATH environment variable:


export DOCLING_ARTIFACTS_PATH="/local/path/to/models"
python my_docling_script.py
Using remote services
The main purpose of Docling is to run local models which are not sharing any user data with remote services. Anyhow, there are valid use cases for processing part of the pipeline using remote services, for example invoking OCR engines from cloud vendors or the usage of hosted LLMs.

In Docling we decided to allow such models, but we require the user to explicitly opt-in in communicating with external services.


from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

pipeline_options = PdfPipelineOptions(enable_remote_services=True)
doc_converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    }
)
When the value enable_remote_services=True is not set, the system will raise an exception OperationNotAllowed().

Note: This option is only related to the system sending user data to remote services. Control of pulling data (e.g. model weights) follows the logic described in Model prefetching and offline usage.

List of remote model services
The options in this list require the explicit enable_remote_services=True when processing the documents.

PictureDescriptionApiOptions: Using vision models via API calls.
Adjust pipeline features
The example file custom_convert.py contains multiple ways one can adjust the conversion pipeline and features.

Control PDF table extraction options
You can control if table structure recognition should map the recognized structure back to PDF cells (default) or use text cells from the structure prediction itself. This can improve output quality if you find that multiple columns in extracted tables are erroneously merged into one.


from docling.datamodel.base_models import InputFormat
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions

pipeline_options = PdfPipelineOptions(do_table_structure=True)
pipeline_options.table_structure_options.do_cell_matching = False  # uses text cells predicted from table structure model

doc_converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    }
)
Since docling 1.16.0: You can control which TableFormer mode you want to use. Choose between TableFormerMode.FAST (faster but less accurate) and TableFormerMode.ACCURATE (default) to receive better quality with difficult table structures.


from docling.datamodel.base_models import InputFormat
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode

pipeline_options = PdfPipelineOptions(do_table_structure=True)
pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE  # use more accurate TableFormer model

doc_converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    }
)
Impose limits on the document size
You can limit the file size and number of pages which should be allowed to process per document:


from pathlib import Path
from docling.document_converter import DocumentConverter

source = "https://arxiv.org/pdf/2408.09869"
converter = DocumentConverter()
result = converter.convert(source, max_num_pages=100, max_file_size=20971520)
Convert from binary PDF streams
You can convert PDFs from a binary stream instead of from the filesystem as follows:


from io import BytesIO
from docling.datamodel.base_models import DocumentStream
from docling.document_converter import DocumentConverter

buf = BytesIO(your_binary_stream)
source = DocumentStream(name="my_doc.pdf", stream=buf)
converter = DocumentConverter()
result = converter.convert(source)
Limit resource usage
You can limit the CPU threads used by Docling by setting the environment variable OMP_NUM_THREADS accordingly. The default setting is using 4 CPU threads.

Use specific backend converters
Note

This section discusses directly invoking a backend, i.e. using a low-level API. This should only be done when necessary. For most cases, using a DocumentConverter (high-level API) as discussed in the sections above should suffice — and is the recommended way.

By default, Docling will try to identify the document format to apply the appropriate conversion backend (see the list of supported formats). You can restrict the DocumentConverter to a set of allowed document formats, as shown in the Multi-format conversion example. Alternatively, you can also use the specific backend that matches your document content. For instance, you can use HTMLDocumentBackend for HTML pages:


import urllib.request
from io import BytesIO
from docling.backend.html_backend import HTMLDocumentBackend
from docling.datamodel.base_models import InputFormat
from docling.datamodel.document import InputDocument

url = "https://en.wikipedia.org/wiki/Duck"
text = urllib.request.urlopen(url).read()
in_doc = InputDocument(
    path_or_stream=BytesIO(text),
    format=InputFormat.HTML,
    backend=HTMLDocumentBackend,
    filename="duck.html",
)
backend = HTMLDocumentBackend(in_doc=in_doc, path_or_stream=BytesIO(text))
dl_doc = backend.convert()
print(dl_doc.export_to_markdown())
Chunking
You can chunk a Docling document using a chunker, such as a HybridChunker, as shown below (for more details check out this example):


from docling.document_converter import DocumentConverter
from docling.chunking import HybridChunker

conv_res = DocumentConverter().convert("https://arxiv.org/pdf/2206.01062")
doc = conv_res.document

chunker = HybridChunker(tokenizer="BAAI/bge-small-en-v1.5")  # set tokenizer as needed
chunk_iter = chunker.chunk(doc)
An example chunk would look like this:


print(list(chunk_iter)[11])
# {
#   "text": "In this paper, we present the DocLayNet dataset. [...]",
#   "meta": {
#     "doc_items": [{
#       "self_ref": "#/texts/28",
#       "label": "text",
#       "prov": [{
#         "page_no": 2,
#         "bbox": {"l": 53.29, "t": 287.14, "r": 295.56, "b": 212.37, ...},
#       }], ...,
#     }, ...],
#     "headings": ["1 INTRODUCTION"],
#   }
# }


## Supported formats
Docling can parse various documents formats into a unified representation (Docling Document), which it can export to different formats too — check out Architecture for more details.

Below you can find a listing of all supported input and output formats.

Supported input formats
Format	Description
PDF	
DOCX, XLSX, PPTX	Default formats in MS Office 2007+, based on Office Open XML
Markdown	
AsciiDoc	
HTML, XHTML	
CSV	
PNG, JPEG, TIFF, BMP, WEBP	Image formats
Schema-specific support:

Format	Description
USPTO XML	XML format followed by USPTO patents
JATS XML	XML format followed by JATS articles
Docling JSON	JSON-serialized Docling Document
Supported output formats
Format	Description
HTML	Both image embedding and referencing are supported
Markdown	
JSON	Lossless serialization of Docling Document
Text	Plain text, i.e. without Markdown markers
Doctags	


## Enrichment features
Docling allows to enrich the conversion pipeline with additional steps which process specific document components, e.g. code blocks, pictures, etc. The extra steps usually require extra models executions which may increase the processing time consistently. For this reason most enrichment models are disabled by default.

The following table provides an overview of the default enrichment models available in Docling.

Feature	Parameter	Processed item	Description
Code understanding	do_code_enrichment	CodeItem	See docs below.
Formula understanding	do_formula_enrichment	TextItem with label FORMULA	See docs below.
Picture classification	do_picture_classification	PictureItem	See docs below.
Picture description	do_picture_description	PictureItem	See docs below.
Enrichments details
Code understanding
The code understanding step allows to use advance parsing for code blocks found in the document. This enrichment model also set the code_language property of the CodeItem.

Model specs: see the CodeFormula model card.

Example command line:


docling --enrich-code FILE
Example code:


from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat

pipeline_options = PdfPipelineOptions()
pipeline_options.do_code_enrichment = True

converter = DocumentConverter(format_options={
    InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
})

result = converter.convert("https://arxiv.org/pdf/2501.17887")
doc = result.document
Formula understanding
The formula understanding step will analize the equation formulas in documents and extract their LaTeX representation. The HTML export functions in the DoclingDocument will leverage the formula and visualize the result using the mathml html syntax.

Model specs: see the CodeFormula model card.

Example command line:


docling --enrich-formula FILE
Example code:


from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat

pipeline_options = PdfPipelineOptions()
pipeline_options.do_formula_enrichment = True

converter = DocumentConverter(format_options={
    InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
})

result = converter.convert("https://arxiv.org/pdf/2501.17887")
doc = result.document
Picture classification
The picture classification step classifies the PictureItem elements in the document with the DocumentFigureClassifier model. This model is specialized to understand the classes of pictures found in documents, e.g. different chart types, flow diagrams, logos, signatures, etc.

Model specs: see the DocumentFigureClassifier model card.

Example command line:


docling --enrich-picture-classes FILE
Example code:


from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat

pipeline_options = PdfPipelineOptions()
pipeline_options.generate_picture_images = True
pipeline_options.images_scale = 2
pipeline_options.do_picture_classification = True

converter = DocumentConverter(format_options={
    InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
})

result = converter.convert("https://arxiv.org/pdf/2501.17887")
doc = result.document
Picture description
The picture description step allows to annotate a picture with a vision model. This is also known as a "captioning" task. The Docling pipeline allows to load and run models completely locally as well as connecting to remote API which support the chat template. Below follow a few examples on how to use some common vision model and remote services.


from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat

pipeline_options = PdfPipelineOptions()
pipeline_options.do_picture_description = True

converter = DocumentConverter(format_options={
    InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
})

result = converter.convert("https://arxiv.org/pdf/2501.17887")
doc = result.document
Granite Vision model
Model specs: see the ibm-granite/granite-vision-3.1-2b-preview model card.

Usage in Docling:


from docling.datamodel.pipeline_options import granite_picture_description

pipeline_options.picture_description_options = granite_picture_description
SmolVLM model
Model specs: see the HuggingFaceTB/SmolVLM-256M-Instruct model card.

Usage in Docling:


from docling.datamodel.pipeline_options import smolvlm_picture_description

pipeline_options.picture_description_options = smolvlm_picture_description
Other vision models
The option class PictureDescriptionVlmOptions allows to use any another model from the Hugging Face Hub.


from docling.datamodel.pipeline_options import PictureDescriptionVlmOptions

pipeline_options.picture_description_options = PictureDescriptionVlmOptions(
    repo_id="",  # <-- add here the Hugging Face repo_id of your favorite VLM
    prompt="Describe the image in three sentences. Be consise and accurate.",
)
Remote vision model
The option class PictureDescriptionApiOptions allows to use models hosted on remote platforms, e.g. on local endpoints served by VLLM, Ollama and others, or cloud providers like IBM watsonx.ai, etc.

Note: in most cases this option will send your data to the remote service provider.

Usage in Docling:


from docling.datamodel.pipeline_options import PictureDescriptionApiOptions

# Enable connections to remote services
pipeline_options.enable_remote_services=True  # <-- this is required!

# Example using a model running locally, e.g. via VLLM
# $ vllm serve MODEL_NAME
pipeline_options.picture_description_options = PictureDescriptionApiOptions(
    url="http://localhost:8000/v1/chat/completions",
    params=dict(
        model="MODEL NAME",
        seed=42,
        max_completion_tokens=200,
    ),
    prompt="Describe the image in three sentences. Be consise and accurate.",
    timeout=90,
)
End-to-end code snippets for cloud providers are available in the examples section:

IBM watsonx.ai
Develop new enrichment models
Beside looking at the implementation of all the models listed above, the Docling documentation has a few examples dedicated to the implementation of enrichment models.

Develop picture enrichment
Develop formula enrichment

## Vision models
The VlmPipeline in Docling allows you to convert documents end-to-end using a vision-language model.

Docling supports vision-language models which output:

DocTags (e.g. SmolDocling), the preferred choice
Markdown
HTML
For running Docling using local models with the VlmPipeline:


CLI
Python
See also the example minimal_vlm_pipeline.py.


from docling.datamodel.base_models import InputFormat
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.pipeline.vlm_pipeline import VlmPipeline

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_cls=VlmPipeline,
        ),
    }
)

doc = converter.convert(source="FILE").document

Available local models
By default, the vision-language models are running locally. Docling allows to choose between the Hugging Face Transformers framework and the MLX (for Apple devices with MPS acceleration) one.

The following table reports the models currently available out-of-the-box.

Model instance	Model	Framework	Device	Num pages	Inference time (sec)
vlm_model_specs.SMOLDOCLING_TRANSFORMERS	ds4sd/SmolDocling-256M-preview	Transformers/AutoModelForVision2Seq	MPS	1	102.212
vlm_model_specs.SMOLDOCLING_MLX	ds4sd/SmolDocling-256M-preview-mlx-bf16	MLX	MPS	1	6.15453
vlm_model_specs.QWEN25_VL_3B_MLX	mlx-community/Qwen2.5-VL-3B-Instruct-bf16	MLX	MPS	1	23.4951
vlm_model_specs.PIXTRAL_12B_MLX	mlx-community/pixtral-12b-bf16	MLX	MPS	1	308.856
vlm_model_specs.GEMMA3_12B_MLX	mlx-community/gemma-3-12b-it-bf16	MLX	MPS	1	378.486
vlm_model_specs.GRANITE_VISION_TRANSFORMERS	ibm-granite/granite-vision-3.2-2b	Transformers/AutoModelForVision2Seq	MPS	1	104.75
vlm_model_specs.PHI4_TRANSFORMERS	microsoft/Phi-4-multimodal-instruct	Transformers/AutoModelForCasualLM	CPU	1	1175.67
vlm_model_specs.PIXTRAL_12B_TRANSFORMERS	mistral-community/pixtral-12b	Transformers/AutoModelForVision2Seq	CPU	1	1828.21
Inference time is computed on a Macbook M3 Max using the example page tests/data/pdf/2305.03393v1-pg9.pdf. The comparison is done with the example compare_vlm_models.py.

For choosing the model, the code snippet above can be extended as follow


from docling.datamodel.base_models import InputFormat
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.pipeline.vlm_pipeline import VlmPipeline
from docling.datamodel.pipeline_options import (
    VlmPipelineOptions,
)
from docling.datamodel import vlm_model_specs

pipeline_options = VlmPipelineOptions(
    vlm_options=vlm_model_specs.SMOLDOCLING_MLX,  # <-- change the model here
)

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_cls=VlmPipeline,
            pipeline_options=pipeline_options,
        ),
    }
)

doc = converter.convert(source="FILE").document
Other models
Other models can be configured by directly providing the Hugging Face repo_id, the prompt and a few more options.

For example:


from docling.datamodel.pipeline_options_vlm_model import InlineVlmOptions, InferenceFramework, TransformersModelType

pipeline_options = VlmPipelineOptions(
    vlm_options=InlineVlmOptions(
        repo_id="ibm-granite/granite-vision-3.2-2b",
        prompt="Convert this page to markdown. Do not miss any text and only output the bare markdown!",
        response_format=ResponseFormat.MARKDOWN,
        inference_framework=InferenceFramework.TRANSFORMERS,
        transformers_model_type=TransformersModelType.AUTOMODEL_VISION2SEQ,
        supported_devices=[
            AcceleratorDevice.CPU,
            AcceleratorDevice.CUDA,
            AcceleratorDevice.MPS,
        ],
        scale=2.0,
        temperature=0.0,
    )
)
Remote models
Additionally to local models, the VlmPipeline allows to offload the inference to a remote service hosting the models. Many remote inference services are provided, the key requirement is to offer an OpenAI-compatible API. This includes vLLM, Ollama, etc.

More examples on how to connect with the remote inference services can be found in the following examples:

vlm_pipeline_api_model.py


## FAQ
This is a collection of FAQ collected from the user questions on https://github.com/docling-project/docling/discussions.

Is Python 3.13 supported?
Is Python 3.13 supported?
Python 3.13 is supported from Docling 2.18.0.

Install conflicts with numpy (python 3.13)
Install conflicts with numpy (python 3.13)
When using docling-ibm-models>=2.0.7 and deepsearch-glm>=0.26.2 these issues should not show up anymore. Docling supports numpy versions >=1.24.4,<3.0.0 which should match all usages.

For older versions

This has been observed installing docling and langchain via poetry.


...
Thus, docling (>=2.7.0,<3.0.0) requires numpy (>=1.26.4,<2.0.0).
So, because ... depends on both numpy (>=2.0.2,<3.0.0) and docling (^2.7.0), version solving failed.
Numpy is only adding Python 3.13 support starting in some 2.x.y version. In order to prepare for 3.13, Docling depends on a 2.x.y for 3.13, otherwise depending an 1.x.y version. If you are allowing 3.13 in your pyproject.toml, Poetry will try to find some way to reconcile Docling's numpy version for 3.13 (some 2.x.y) with LangChain's version for that (some 1.x.y) — leading to the error above.

Check if Python 3.13 is among the Python versions allowed by your pyproject.toml and if so, remove it and try again. E.g., if you have python = "^3.10", use python = ">=3.10,<3.13" instead.

If you want to retain compatibility with python 3.9-3.13, you can also use a selector in pyproject.toml similar to the following


numpy = [
    { version = "^2.1.0", markers = 'python_version >= "3.13"' },
    { version = "^1.24.4", markers = 'python_version < "3.13"' },
]
Source: Issue #283

Is macOS x86_64 supported?
Is macOS x86_64 supported?
Yes, Docling (still) supports running the standard pipeline on macOS x86_64.

However, users might get into a combination of incompatible dependencies on a fresh install. Because Docling depends on PyTorch which dropped support for macOS x86_64 after the 2.2.2 release, and this old version of PyTorch works only with NumPy 1.x, users must ensure the correct NumPy version is running.


pip install docling "numpy<2.0.0"
Source: Issue #1694.

Are text styles (bold, underline, etc) supported?
Are text styles (bold, underline, etc) supported?
Currently text styles are not supported in the DoclingDocument format. If you are interest in contributing this feature, please open a discussion topic to brainstorm on the design.

Note: this is not a simple topic

How do I run completely offline?
How do I run completely offline?
Docling is not using any remote service, hence it can run in completely isolated air-gapped environments.

The only requirement is pointing the Docling runtime to the location where the model artifacts have been stored.

For example


pipeline_options = PdfPipelineOptions(artifacts_path="your location")
converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    }
)
Source: Issue #326

Which model weights are needed to run Docling?
Which model weights are needed to run Docling?
Model weights are needed for the AI models used in the PDF pipeline. Other document types (docx, pptx, etc) do not have any such requirement.

For processing PDF documents, Docling requires the model weights from https://huggingface.co/ds4sd/docling-models.

When OCR is enabled, some engines also require model artifacts. For example EasyOCR, for which Docling has special pipeline options to control the runtime behavior.

SSL error downloading model weights
SSL error downloading model weights

URLError: <urlopen error [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1000)>
Similar SSL download errors have been observed by some users. This happens when model weights are fetched from Hugging Face. The error could happen when the python environment doesn't have an up-to-date list of trusted certificates.

Possible solutions were

Update to the latest version of certifi, i.e. pip install --upgrade certifi
Use pip-system-certs to use the latest trusted certificates on your system.
Set environment variables SSL_CERT_FILE and REQUESTS_CA_BUNDLE to the value of python -m certifi:

CERT_PATH=$(python -m certifi)
export SSL_CERT_FILE=${CERT_PATH}
export REQUESTS_CA_BUNDLE=${CERT_PATH}
Which OCR languages are supported?
Which OCR languages are supported?
Docling supports multiple OCR engine, each one has its own list of supported languages. Here is a collection of links to the original OCR engine's documentation listing the OCR languages.

EasyOCR
Tesseract
RapidOCR
Mac OCR
Setting the OCR language in Docling is done via the OCR pipeline options:


from docling.datamodel.pipeline_options import PdfPipelineOptions

pipeline_options = PdfPipelineOptions()
pipeline_options.ocr_options.lang = ["fr", "de", "es", "en"]  # example of languages for EasyOCR
Some images are missing from MS Word and Powerpoint
Some images are missing from MS Word and Powerpoint
The image processing library used by Docling is able to handle embedded WMF images only on Windows platform. If you are on other operating systems, these images will be ignored.

HybridChunker triggers warning: 'Token indices sequence length is longer than the specified maximum sequence length for this model'
HybridChunker triggers warning: 'Token indices sequence length is longer than the specified maximum sequence length for this model'
TLDR: In the context of the HybridChunker, this is a known & ancitipated "false alarm".

Details:

Using the HybridChunker often triggers a warning like this:

Token indices sequence length is longer than the specified maximum sequence length for this model (531 > 512). Running this sequence through the model will result in indexing errors

This is a warning that is emitted by transformers, saying that actually running this sequence through the model will result in indexing errors, i.e. the problematic case is only if one indeed passes the particular sequence through the (embedding) model.

In our case though, this occurs as a "false alarm", since what happens is the following:

the chunker invokes the tokenizer on a potentially long sequence (e.g. 530 tokens as mentioned in the warning) in order to count its tokens, i.e. to assess if it is short enough. At this point transformers already emits the warning above!
whenever the sequence at hand is oversized, the chunker proceeds to split it (but the transformers warning has already been shown nonetheless)
What is important is the actual token length of the produced chunks. The snippet below can be used for getting the actual maximum chunk size (for users wanting to confirm that this does not exceed the model limit):


chunk_max_len = 0
for i, chunk in enumerate(chunks):
    ser_txt = chunker.serialize(chunk=chunk)
    ser_tokens = len(tokenizer.tokenize(ser_txt))
    if ser_tokens > chunk_max_len:
        chunk_max_len = ser_tokens
    print(f"{i}\t{ser_tokens}\t{repr(ser_txt[:100])}...")
print(f"Longest chunk yielded: {chunk_max_len} tokens")
print(f"Model max length: {tokenizer.model_max_length}")
Also see docling#725.

Source: Issue docling-core#119

How to use flash attention?
How to use flash attention?
When running models in Docling on CUDA devices, you can enable the usage of the Flash Attention2 library.

Using environment variables:


DOCLING_CUDA_USE_FLASH_ATTENTION2=1
Using code:


from docling.datamodel.accelerator_options import (
    AcceleratorOptions,
)

pipeline_options = VlmPipelineOptions(
    accelerator_options=AcceleratorOptions(cuda_use_flash_attention2=True)
)
This requires having the flash-attn package installed. Below are two alternative ways for installing it:


# Building from sources (required the CUDA dev environment)
pip install flash-attn

# Using pre-built wheels (not available in all possible setups)
FLASH_ATTENTION_SKIP_CUDA_BUILD=TRUE pip install flash-attn

## Architecture
docling_architecture

In a nutshell, Docling's architecture is outlined in the diagram above.

For each document format, the document converter knows which format-specific backend to employ for parsing the document and which pipeline to use for orchestrating the execution, along with any relevant options.

Tip

While the document converter holds a default mapping, this configuration is parametrizable, so e.g. for the PDF format, different backends and different pipeline options can be used — see Usage.

The conversion result contains the Docling document, Docling's fundamental document representation.

Some typical scenarios for using a Docling document include directly calling its export methods, such as for markdown, dictionary etc., or having it serialized by a serializer or chunked by a chunker.

For more details on Docling's architecture, check out the Docling Technical Report.

Note

The components illustrated with dashed outline indicate base classes that can be subclassed for specialized implementations.

## Docling Document
With Docling v2, we introduce a unified document representation format called DoclingDocument. It is defined as a pydantic datatype, which can express several features common to documents, such as:

Text, Tables, Pictures, and more
Document hierarchy with sections and groups
Disambiguation between main body and headers, footers (furniture)
Layout information (i.e. bounding boxes) for all items, if available
Provenance information
The definition of the Pydantic types is implemented in the module docling_core.types.doc, more details in source code definitions.

It also brings a set of document construction APIs to build up a DoclingDocument from scratch.

Example document structures
To illustrate the features of the DoclingDocument format, in the subsections below we consider the DoclingDocument converted from tests/data/word_sample.docx and we present some side-by-side comparisons, where the left side shows snippets from the converted document serialized as YAML and the right one shows the corresponding parts of the original MS Word.

Basic structure
A DoclingDocument exposes top-level fields for the document content, organized in two categories. The first category is the content items, which are stored in these fields:

texts: All items that have a text representation (paragraph, section heading, equation, ...). Base class is TextItem.
tables: All tables, type TableItem. Can carry structure annotations.
pictures: All pictures, type PictureItem. Can carry structure annotations.
key_value_items: All key-value items.
All of the above fields are lists and store items inheriting from the DocItem type. They can express different data structures depending on their type, and reference parents and children through JSON pointers.

The second category is content structure, which is encapsulated in:

body: The root node of a tree-structure for the main document body
furniture: The root node of a tree-structure for all items that don't belong into the body (headers, footers, ...)
groups: A set of items that don't represent content, but act as containers for other content items (e.g. a list, a chapter)
All of the above fields are only storing NodeItem instances, which reference children and parents through JSON pointers.

The reading order of the document is encapsulated through the body tree and the order of children in each item in the tree.

Below example shows how all items in the first page are nested below the title item (#/texts/1).

doc_hierarchy_1

Grouping
Below example shows how all items under the heading "Let's swim" (#/texts/5) are nested as children. The children of "Let's swim" are both text items and groups, which contain the list elements. The group items are stored in the top-level groups field.

doc_hierarchy_2

## Serialization
Introduction
A document serializer (AKA simply serializer) is a Docling abstraction that is initialized with a given DoclingDocument and returns a textual representation for that document.

Besides the document serializer, Docling defines similar abstractions for several document subcomponents, for example: text serializer, table serializer, picture serializer, list serializer, inline serializer, and more.

Last but not least, a serializer provider is a wrapper that abstracts the document serialization strategy from the document instance.

Base classes
To enable both flexibility for downstream applications and out-of-the-box utility, Docling defines a serialization class hierarchy, providing:

base types for the above abstractions: BaseDocSerializer, as well as BaseTextSerializer, BaseTableSerializer etc, and BaseSerializerProvider, and
specific subclasses for the above-mentioned base types, e.g. MarkdownDocSerializer.
You can review all methods required to define the above base classes here.

From a client perspective, the most relevant is BaseDocSerializer.serialize(), which returns the textual representation, as well as relevant metadata on which document components contributed to that serialization.

Use in DoclingDocument export methods
Docling provides predefined serializers for Markdown, HTML, and DocTags.

The respective DoclingDocument export methods (e.g. export_to_markdown()) are provided as user shorthands — internally directly instantiating and delegating to respective serializers.

Examples
For an example showcasing how to use serializers, see here.


Confidence Scores
Introduction
Confidence grades were introduced in v2.34.0 to help users understand how well a conversion performed and guide decisions about post-processing workflows. They are available in the confidence field of the ConversionResult object returned by the document converter.

Purpose
Complex layouts, poor scan quality, or challenging formatting can lead to suboptimal document conversion results that may require additional attention or alternative conversion pipelines.

Confidence scores provide a quantitative assessment of document conversion quality. Each confidence report includes a numerical score (0.0 to 1.0) measuring conversion accuracy, and a quality grade (poor, fair, good, excellent) for quick interpretation.

Focus on quality grades!

Users can and should safely focus on the document-level grade fields — mean_grade and low_grade — to assess overall conversion quality. Numerical scores are used internally and are for informational purposes only; their computation and weighting may change in the future.

Use cases for confidence grades include:

Identify documents requiring manual review after the conversion
Adjust conversion pipelines to the most appropriate for each document type
Set confidence thresholds for unattended batch conversions
Catch potential conversion issues early in your workflow.
Concepts
Scores and grades
A confidence report contains scores and grades:

Scores: Numerical values between 0.0 and 1.0, where higher values indicate better conversion quality, for internal use only
Grades: Categorical quality assessments based on score thresholds, used to assess the overall conversion confidence:
POOR
FAIR
GOOD
EXCELLENT
Types of confidence calculated
Each confidence report includes four component scores and grades:

layout_score: Overall quality of document element recognition
ocr_score: Quality of OCR-extracted content
parse_score: 10th percentile score of digital text cells (emphasizes problem areas)
table_score: Table extraction quality (not yet implemented)
Summary grades
Two aggregate grades provide overall document quality assessment:

mean_grade: Average of the four component scores
low_grade: 5th percentile score (highlights worst-performing areas)
Page-level vs document-level
Confidence grades are calculated at two levels:

Page-level: Individual scores and grades for each page, stored in the pages field
Document-level: Overall scores and grades for the entire document, calculated as averages of the page-level grades and stored in fields equally named in the root ConfidenceReport
[Example]https://docling-project.github.io/docling/concepts/confidence_scores/#types-of-confidence-calculated:~:text=Example-,Confidence%20Scores,Example,-Back%20to%20top


## Chunking
Introduction
Chunking approaches

Starting from a DoclingDocument, there are in principle two possible chunking approaches:

exporting the DoclingDocument to Markdown (or similar format) and then performing user-defined chunking as a post-processing step, or
using native Docling chunkers, i.e. operating directly on the DoclingDocument
This page is about the latter, i.e. using native Docling chunkers. For an example of using approach (1) check out e.g. this recipe looking at the Markdown export mode.

A chunker is a Docling abstraction that, given a DoclingDocument, returns a stream of chunks, each of which captures some part of the document as a string accompanied by respective metadata.

To enable both flexibility for downstream applications and out-of-the-box utility, Docling defines a chunker class hierarchy, providing a base type, BaseChunker, as well as specific subclasses.

Docling integration with gen AI frameworks like LlamaIndex is done using the BaseChunker interface, so users can easily plug in any built-in, self-defined, or third-party BaseChunker implementation.

Base Chunker
The BaseChunker base class API defines that any chunker should provide the following:

def chunk(self, dl_doc: DoclingDocument, **kwargs) -> Iterator[BaseChunk]: Returning the chunks for the provided document.
def contextualize(self, chunk: BaseChunk) -> str: Returning the potentially metadata-enriched serialization of the chunk, typically used to feed an embedding model (or generation model).
Hybrid Chunker
To access HybridChunker

If you are using the docling package, you can import as follows:

from docling.chunking import HybridChunker
If you are only using the docling-core package, you must ensure to install the chunking extra if you want to use HuggingFace tokenizers, e.g.

pip install 'docling-core[chunking]'
or the chunking-openai extra if you prefer Open AI tokenizers (tiktoken), e.g.

pip install 'docling-core[chunking-openai]'
and then you can import as follows:

from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
The HybridChunker implementation uses a hybrid approach, applying tokenization-aware refinements on top of document-based hierarchical chunking.

More precisely:

it starts from the result of the hierarchical chunker and, based on the user-provided tokenizer (typically to be aligned to the embedding model tokenizer), it:
does one pass where it splits chunks only when needed (i.e. oversized w.r.t. tokens), &
another pass where it merges chunks only when possible (i.e. undersized successive chunks with same headings & captions) — users can opt out of this step via param merge_peers (by default True)
👉 Usage examples:

Hybrid chunking
Advanced chunking & serialization
Hierarchical Chunker
The HierarchicalChunker implementation uses the document structure information from the DoclingDocument to create one chunk for each individual detected document element, by default only merging together list items (can be opted out via param merge_list_items). It also takes care of attaching all relevant document metadata, including headers and captions.

## Plugins
Docling allows to be extended with third-party plugins which extend the choice of options provided in several steps of the pipeline.

Plugins are loaded via the pluggy system which allows third-party developers to register the new capabilities using the setuptools entrypoint.

The actual entrypoint definition might vary, depending on the packaging system you are using. Here are a few examples:


pyproject.toml
poetry v1 pyproject.toml
setup.cfg
setup.py

[project.entry-points."docling"]
your_plugin_name = "your_package.module"

your_plugin_name is the name you choose for your plugin. This must be unique among the broader Docling ecosystem.
your_package.module is the reference to the module in your package which is responsible for the plugin registration.
Plugin factories
OCR factory
The OCR factory allows to provide more OCR engines to the Docling users.

The content of your_package.module registers the OCR engines with a code similar to:


# Factory registration
def ocr_engines():
    return {
        "ocr_engines": [
            YourOcrModel,
        ]
    }
where YourOcrModel must implement the BaseOcrModel and provide an options class derived from OcrOptions.

If you look for an example, the default Docling plugins is a good starting point.

Third-party plugins
When the plugin is not provided by the main docling package but by a third-party package this have to be enabled explicitly via the allow_external_plugins option.


from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

pipeline_options = PdfPipelineOptions()
pipeline_options.allow_external_plugins = True  # <-- enabled the external plugins
pipeline_options.ocr_options = YourOptions  # <-- your options here

doc_converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=pipeline_options
        )
    }
)
Using the docling CLI
Similarly, when using the docling users have to enable external plugins before selecting the new one.


# Show the external plugins
docling --show-external-plugins

# Run docling with the new plugin
docling --allow-external-plugins --ocr-engine=NAME




## Simple conversion
from docling.document_converter import DocumentConverter

source = "https://arxiv.org/pdf/2408.09869"  # document per local path or URL

converter = DocumentConverter()

doc = converter.convert(source).document

print(doc.export_to_markdown())

# output: ## Docling Technical Report [...]"



## Custom conversion
import json
import logging
import time
from pathlib import Path
from docling.datamodel.accelerator_options import AcceleratorDevice, AcceleratorOptions
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
_log = logging.getLogger(__name__)
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"

    ###########################################################################

    # The following sections contain a combination of PipelineOptions
    # and PDF Backends for various configurations.
    # Uncomment one section at the time to see the differences in the output.

    # PyPdfium without EasyOCR
    # --------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = False
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = False

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(
    #             pipeline_options=pipeline_options, backend=PyPdfiumDocumentBackend
    #         )
    #     }
    # )

    # PyPdfium with EasyOCR
    # -----------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = True
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(
    #             pipeline_options=pipeline_options, backend=PyPdfiumDocumentBackend
    #         )
    #     }
    # )

    # Docling Parse without EasyOCR
    # -------------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = False
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    #     }
    # )

    # Docling Parse with EasyOCR
    # ----------------------
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = True
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.do_cell_matching = True
    pipeline_options.ocr_options.lang = ["es"]
    pipeline_options.accelerator_options = AcceleratorOptions(
        num_threads=4, device=AcceleratorDevice.AUTO
    )

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    # Docling Parse with EasyOCR (CPU only)
    # ----------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = True
    # pipeline_options.ocr_options.use_gpu = False  # <-- set this.
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    #     }
    # )

    # Docling Parse with Tesseract
    # ----------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = True
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True
    # pipeline_options.ocr_options = TesseractOcrOptions()

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    #     }
    # )

    # Docling Parse with Tesseract CLI
    # ----------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = True
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True
    # pipeline_options.ocr_options = TesseractCliOcrOptions()

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    #     }
    # )

    # Docling Parse with ocrmac(Mac only)
    # ----------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = True
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True
    # pipeline_options.ocr_options = OcrMacOptions()

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    #     }
    # )

    ###########################################################################

    start_time = time.time()
    conv_result = doc_converter.convert(input_doc_path)
    end_time = time.time() - start_time

    _log.info(f"Document converted in {end_time:.2f} seconds.")

    ## Export results
    output_dir = Path("scratch")
    output_dir.mkdir(parents=True, exist_ok=True)
    doc_filename = conv_result.input.file.stem

    # Export Deep Search document JSON format:
    with (output_dir / f"{doc_filename}.json").open("w", encoding="utf-8") as fp:
        fp.write(json.dumps(conv_result.document.export_to_dict()))

    # Export Text format:
    with (output_dir / f"{doc_filename}.txt").open("w", encoding="utf-8") as fp:
        fp.write(conv_result.document.export_to_text())

    # Export Markdown format:
    with (output_dir / f"{doc_filename}.md").open("w", encoding="utf-8") as fp:
        fp.write(conv_result.document.export_to_markdown())

    # Export Document Tags format:
    with (output_dir / f"{doc_filename}.doctags").open("w", encoding="utf-8") as fp:
        fp.write(conv_result.document.export_to_document_tokens())
if __name__ == "__main__":
    main()



## Batch conversion
import json
import logging
import time
from collections.abc import Iterable
from pathlib import Path


import yaml
from docling_core.types.doc import ImageRefMode


from docling.backend.docling_parse_v4_backend import DoclingParseV4DocumentBackend
from docling.datamodel.base_models import ConversionStatus, InputFormat
from docling.datamodel.document import ConversionResult
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption


_log = logging.getLogger(__name__)


USE_V2 = True
USE_LEGACY = False


def export_documents(
    conv_results: Iterable[ConversionResult],
    output_dir: Path,
):
    output_dir.mkdir(parents=True, exist_ok=True)

    success_count = 0
    failure_count = 0
    partial_success_count = 0

    for conv_res in conv_results:
        if conv_res.status == ConversionStatus.SUCCESS:
            success_count += 1
            doc_filename = conv_res.input.file.stem

            if USE_V2:
                conv_res.document.save_as_json(
                    output_dir / f"{doc_filename}.json",
                    image_mode=ImageRefMode.PLACEHOLDER,
                )
                conv_res.document.save_as_html(
                    output_dir / f"{doc_filename}.html",
                    image_mode=ImageRefMode.EMBEDDED,
                )
                conv_res.document.save_as_document_tokens(
                    output_dir / f"{doc_filename}.doctags.txt"
                )
                conv_res.document.save_as_markdown(
                    output_dir / f"{doc_filename}.md",
                    image_mode=ImageRefMode.PLACEHOLDER,
                )
                conv_res.document.save_as_markdown(
                    output_dir / f"{doc_filename}.txt",
                    image_mode=ImageRefMode.PLACEHOLDER,
                    strict_text=True,
                )

                # Export Docling document format to YAML:
                with (output_dir / f"{doc_filename}.yaml").open("w") as fp:
                    fp.write(yaml.safe_dump(conv_res.document.export_to_dict()))

                # Export Docling document format to doctags:
                with (output_dir / f"{doc_filename}.doctags.txt").open("w") as fp:
                    fp.write(conv_res.document.export_to_document_tokens())

                # Export Docling document format to markdown:
                with (output_dir / f"{doc_filename}.md").open("w") as fp:
                    fp.write(conv_res.document.export_to_markdown())

                # Export Docling document format to text:
                with (output_dir / f"{doc_filename}.txt").open("w") as fp:
                    fp.write(conv_res.document.export_to_markdown(strict_text=True))

            if USE_LEGACY:
                # Export Deep Search document JSON format:
                with (output_dir / f"{doc_filename}.legacy.json").open(
                    "w", encoding="utf-8"
                ) as fp:
                    fp.write(json.dumps(conv_res.legacy_document.export_to_dict()))

                # Export Text format:
                with (output_dir / f"{doc_filename}.legacy.txt").open(
                    "w", encoding="utf-8"
                ) as fp:
                    fp.write(
                        conv_res.legacy_document.export_to_markdown(strict_text=True)
                    )

                # Export Markdown format:
                with (output_dir / f"{doc_filename}.legacy.md").open(
                    "w", encoding="utf-8"
                ) as fp:
                    fp.write(conv_res.legacy_document.export_to_markdown())

                # Export Document Tags format:
                with (output_dir / f"{doc_filename}.legacy.doctags.txt").open(
                    "w", encoding="utf-8"
                ) as fp:
                    fp.write(conv_res.legacy_document.export_to_document_tokens())

        elif conv_res.status == ConversionStatus.PARTIAL_SUCCESS:
            _log.info(
                f"Document {conv_res.input.file} was partially converted with the following errors:"
            )
            for item in conv_res.errors:
                _log.info(f"\t{item.error_message}")
            partial_success_count += 1
        else:
            _log.info(f"Document {conv_res.input.file} failed to convert.")
            failure_count += 1

    _log.info(
        f"Processed {success_count + partial_success_count + failure_count} docs, "
        f"of which {failure_count} failed "
        f"and {partial_success_count} were partially converted."
    )
    return success_count, partial_success_count, failure_count




def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_paths = [
        data_folder / "pdf/2206.01062.pdf",
        data_folder / "pdf/2203.01017v2.pdf",
        data_folder / "pdf/2305.03393v1.pdf",
        data_folder / "pdf/redp5110_sampled.pdf",
    ]

    # buf = BytesIO((data_folder / "pdf/2206.01062.pdf").open("rb").read())
    # docs = [DocumentStream(name="my_doc.pdf", stream=buf)]
    # input = DocumentConversionInput.from_streams(docs)

    # # Turn on inline debug visualizations:
    # settings.debug.visualize_layout = True
    # settings.debug.visualize_ocr = True
    # settings.debug.visualize_tables = True
    # settings.debug.visualize_cells = True

    pipeline_options = PdfPipelineOptions()
    pipeline_options.generate_page_images = True

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options, backend=DoclingParseV4DocumentBackend
            )
        }
    )

    start_time = time.time()

    conv_results = doc_converter.convert_all(
        input_doc_paths,
        raises_on_error=False,  # to let conversion run through all and examine results at the end
    )
    success_count, partial_success_count, failure_count = export_documents(
        conv_results, output_dir=Path("scratch")
    )

    end_time = time.time() - start_time

    _log.info(f"Document conversion complete in {end_time:.2f} seconds.")

    if failure_count > 0:
        raise RuntimeError(
            f"The example failed converting {failure_count} on {len(input_doc_paths)}."
        )

if __name__ == "__main__":
    main()


## Multi-format conversion
import json
import logging
from pathlib import Path


import yaml


from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
from docling.datamodel.base_models import InputFormat
from docling.document_converter import (
    DocumentConverter,
    PdfFormatOption,
    WordFormatOption,
)
from docling.pipeline.simple_pipeline import SimplePipeline
from docling.pipeline.standard_pdf_pipeline import StandardPdfPipeline


_log = logging.getLogger(__name__)


def main():
    input_paths = [
        Path("README.md"),
        Path("tests/data/html/wiki_duck.html"),
        Path("tests/data/docx/word_sample.docx"),
        Path("tests/data/docx/lorem_ipsum.docx"),
        Path("tests/data/pptx/powerpoint_sample.pptx"),
        Path("tests/data/2305.03393v1-pg9-img.png"),
        Path("tests/data/pdf/2206.01062.pdf"),
        Path("tests/data/asciidoc/test_01.asciidoc"),
    ]

    ## for defaults use:
    # doc_converter = DocumentConverter()

    ## to customize use:

    doc_converter = (
        DocumentConverter(  # all of the below is optional, has internal defaults.
            allowed_formats=[
                InputFormat.PDF,
                InputFormat.IMAGE,
                InputFormat.DOCX,
                InputFormat.HTML,
                InputFormat.PPTX,
                InputFormat.ASCIIDOC,
                InputFormat.CSV,
                InputFormat.MD,
            ],  # whitelist formats, non-matching files are ignored.
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_cls=StandardPdfPipeline, backend=PyPdfiumDocumentBackend
                ),
                InputFormat.DOCX: WordFormatOption(
                    pipeline_cls=SimplePipeline  # , backend=MsWordDocumentBackend
                ),
            },
        )
    )

    conv_results = doc_converter.convert_all(input_paths)

    for res in conv_results:
        out_path = Path("scratch")
        print(
            f"Document {res.input.file.name} converted."
            f"\nSaved markdown output to: {out_path!s}"
        )
        _log.debug(res.document._export_to_indented_text(max_text_len=16))
        # Export Docling document format to markdowndoc:
        with (out_path / f"{res.input.file.stem}.md").open("w") as fp:
            fp.write(res.document.export_to_markdown())

        with (out_path / f"{res.input.file.stem}.json").open("w") as fp:
            fp.write(json.dumps(res.document.export_to_dict()))

        with (out_path / f"{res.input.file.stem}.yaml").open("w") as fp:
            fp.write(yaml.safe_dump(res.document.export_to_dict()))


if __name__ == "__main__":
    main()



## VLM pipeline with SmolDocling
from docling.datamodel import vlm_model_specs
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    VlmPipelineOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.pipeline.vlm_pipeline import VlmPipeline
source = "https://arxiv.org/pdf/2501.17887"


USING SIMPLE DEFAULT VALUES
SmolDocling model
Using the transformers framework
converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_cls=VlmPipeline,
        ),
    }
)
doc = converter.convert(source=source).document
print(doc.export_to_markdown())


USING MACOS MPS ACCELERATOR
For more options see the compare_vlm_models.py example.
pipeline_options = VlmPipelineOptions(
    vlm_options=vlm_model_specs.SMOLDOCLING_MLX,
)
converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_cls=VlmPipeline,
            pipeline_options=pipeline_options,
        ),
    }
)

doc = converter.convert(source=source).document

print(doc.export_to_markdown())


## VLM pipeline with remote model
import logging
import os
from pathlib import Path
from typing import Optional
import requests
from docling_core.types.doc.page import SegmentedPage
from dotenv import load_dotenv
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    VlmPipelineOptions,
)
from docling.datamodel.pipeline_options_vlm_model import ApiVlmOptions, ResponseFormat
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.pipeline.vlm_pipeline import VlmPipeline


Example of ApiVlmOptions definitions
Using LM Studio
def lms_vlm_options(model: str, prompt: str, format: ResponseFormat):
    options = ApiVlmOptions(
        url="http://localhost:1234/v1/chat/completions",  # the default LM Studio
        params=dict(
            model=model,
        ),
        prompt=prompt,
        timeout=90,
        scale=1.0,
        response_format=format,
    )
    return options
Using LM Studio with OlmOcr model
def lms_olmocr_vlm_options(model: str):
    def _dynamic_olmocr_prompt(page: Optional[SegmentedPage]):
        if page is None:
            return (
                "Below is the image of one page of a document. Just return the plain text"
                " representation of this document as if you were reading it naturally.\n"
                "Do not hallucinate.\n"
            )

        anchor = [
            f"Page dimensions: {int(page.dimension.width)}x{int(page.dimension.height)}"
        ]

        for text_cell in page.textline_cells:
            if not text_cell.text.strip():
                continue
            bbox = text_cell.rect.to_bounding_box().to_bottom_left_origin(
                page.dimension.height
            )
            anchor.append(f"[{int(bbox.l)}x{int(bbox.b)}] {text_cell.text}")

        for image_cell in page.bitmap_resources:
            bbox = image_cell.rect.to_bounding_box().to_bottom_left_origin(
                page.dimension.height
            )
            anchor.append(
                f"[Image {int(bbox.l)}x{int(bbox.b)} to {int(bbox.r)}x{int(bbox.t)}]"
            )

        if len(anchor) == 1:
            anchor.append(
                f"[Image 0x0 to {int(page.dimension.width)}x{int(page.dimension.height)}]"
            )

        # Original prompt uses cells sorting. We are skipping it in this demo.

        base_text = "\n".join(anchor)

        return (
            f"Below is the image of one page of a document, as well as some raw textual"
            f" content that was previously extracted for it. Just return the plain text"
            f" representation of this document as if you were reading it naturally.\n"
            f"Do not hallucinate.\n"
            f"RAW_TEXT_START\n{base_text}\nRAW_TEXT_END"
        )

    options = ApiVlmOptions(
        url="http://localhost:1234/v1/chat/completions",
        params=dict(
            model=model,
        ),
        prompt=_dynamic_olmocr_prompt,
        timeout=90,
        scale=1.0,
        max_size=1024,  # from OlmOcr pipeline
        response_format=ResponseFormat.MARKDOWN,
    )
    return options


Using Ollama
def ollama_vlm_options(model: str, prompt: str):
    options = ApiVlmOptions(
        url="http://localhost:11434/v1/chat/completions",  # the default Ollama endpoint
        params=dict(
            model=model,
        ),
        prompt=prompt,
        timeout=90,
        scale=1.0,
        response_format=ResponseFormat.MARKDOWN,
    )
    return options


Using a cloud service like IBM watsonx.ai
def watsonx_vlm_options(model: str, prompt: str):
    load_dotenv()
    api_key = os.environ.get("WX_API_KEY")
    project_id = os.environ.get("WX_PROJECT_ID")

    def _get_iam_access_token(api_key: str) -> str:
        res = requests.post(
            url="https://iam.cloud.ibm.com/identity/token",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data=f"grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey={api_key}",
        )
        res.raise_for_status()
        api_out = res.json()
        print(f"{api_out=}")
        return api_out["access_token"]

    options = ApiVlmOptions(
        url="https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29",
        params=dict(
            model_id=model,
            project_id=project_id,
            parameters=dict(
                max_new_tokens=400,
            ),
        ),
        headers={
            "Authorization": "Bearer " + _get_iam_access_token(api_key=api_key),
        },
        prompt=prompt,
        timeout=60,
        response_format=ResponseFormat.MARKDOWN,
    )
    return options


Usage and conversion
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2305.03393v1-pg9.pdf"

    pipeline_options = VlmPipelineOptions(
        enable_remote_services=True  # <-- this is required!
    )

    # The ApiVlmOptions() allows to interface with APIs supporting
    # the multi-modal chat interface. Here follow a few example on how to configure those.

    # One possibility is self-hosting model, e.g. via LM Studio, Ollama or others.

    # Example using the SmolDocling model with LM Studio:
    # (uncomment the following lines)
    pipeline_options.vlm_options = lms_vlm_options(
        model="smoldocling-256m-preview-mlx-docling-snap",
        prompt="Convert this page to docling.",
        format=ResponseFormat.DOCTAGS,
    )

    # Example using the Granite Vision model with LM Studio:
    # (uncomment the following lines)
    # pipeline_options.vlm_options = lms_vlm_options(
    #     model="granite-vision-3.2-2b",
    #     prompt="OCR the full page to markdown.",
    #     format=ResponseFormat.MARKDOWN,
    # )

    # Example using the OlmOcr (dynamic prompt) model with LM Studio:
    # (uncomment the following lines)
    # pipeline_options.vlm_options = lms_olmocr_vlm_options(
    #     model="hf.co/lmstudio-community/olmOCR-7B-0225-preview-GGUF",
    # )

    # Example using the Granite Vision model with Ollama:
    # (uncomment the following lines)
    # pipeline_options.vlm_options = ollama_vlm_options(
    #     model="granite3.2-vision:2b",
    #     prompt="OCR the full page to markdown.",
    # )

    # Another possibility is using online services, e.g. watsonx.ai.
    # Using requires setting the env variables WX_API_KEY and WX_PROJECT_ID.
    # (uncomment the following lines)
    # pipeline_options.vlm_options = watsonx_vlm_options(
    #     model="ibm/granite-vision-3-2-2b", prompt="OCR the full page to markdown."
    # )

    # Create the DocumentConverter and launch the conversion.
    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
                pipeline_cls=VlmPipeline,
            )
        }
    )
    result = doc_converter.convert(input_doc_path)
    print(result.document.export_to_markdown())
if __name__ == "__main__":
    main()


## Compare VLM models
This example runs the VLM pipeline with different vision-language models. Their runtime as well output quality is compared.

import json
import sys
import time
from pathlib import Path
from docling_core.types.doc import DocItemLabel, ImageRefMode
from docling_core.types.doc.document import DEFAULT_EXPORT_LABELS
from tabulate import tabulate
from docling.datamodel import vlm_model_specs
from docling.datamodel.accelerator_options import AcceleratorDevice
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    VlmPipelineOptions,
)
from docling.datamodel.pipeline_options_vlm_model import (
    InferenceFramework,
    InlineVlmOptions,
    ResponseFormat,
    TransformersModelType,
    TransformersPromptStyle,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.pipeline.vlm_pipeline import VlmPipeline
def convert(sources: list[Path], converter: DocumentConverter):
    model_id = pipeline_options.vlm_options.repo_id.replace("/", "_")
    framework = pipeline_options.vlm_options.inference_framework
    for source in sources:
        print("================================================")
        print("Processing...")
        print(f"Source: {source}")
        print("---")
        print(f"Model: {model_id}")
        print(f"Framework: {framework}")
        print("================================================")
        print("")

        res = converter.convert(source)

        print("")

        fname = f"{res.input.file.stem}-{model_id}-{framework}"

        inference_time = 0.0
        for i, page in enumerate(res.pages):
            inference_time += page.predictions.vlm_response.generation_time
            print("")
            print(
                f" ---------- Predicted page {i} in {pipeline_options.vlm_options.response_format} in {page.predictions.vlm_response.generation_time} [sec]:"
            )
            print(page.predictions.vlm_response.text)
            print(" ---------- ")

        print("===== Final output of the converted document =======")

        with (out_path / f"{fname}.json").open("w") as fp:
            fp.write(json.dumps(res.document.export_to_dict()))

        res.document.save_as_json(
            out_path / f"{fname}.json",
            image_mode=ImageRefMode.PLACEHOLDER,
        )
        print(f" => produced {out_path / fname}.json")

        res.document.save_as_markdown(
            out_path / f"{fname}.md",
            image_mode=ImageRefMode.PLACEHOLDER,
        )
        print(f" => produced {out_path / fname}.md")

        res.document.save_as_html(
            out_path / f"{fname}.html",
            image_mode=ImageRefMode.EMBEDDED,
            labels=[*DEFAULT_EXPORT_LABELS, DocItemLabel.FOOTNOTE],
            split_page_view=True,
        )
        print(f" => produced {out_path / fname}.html")

        pg_num = res.document.num_pages()
        print("")
        print(
            f"Total document prediction time: {inference_time:.2f} seconds, pages: {pg_num}"
        )
        print("====================================================")

        return [
            source,
            model_id,
            str(framework),
            pg_num,
            inference_time,
        ]


if __name__ == "__main__":
    sources = [
        "tests/data/pdf/2305.03393v1-pg9.pdf",
    ]

    out_path = Path("scratch")
    out_path.mkdir(parents=True, exist_ok=True)

    ## Definiton of more inline models
    llava_qwen = InlineVlmOptions(
        repo_id="llava-hf/llava-interleave-qwen-0.5b-hf",
        # prompt="Read text in the image.",
        prompt="Convert this page to markdown. Do not miss any text and only output the bare markdown!",
        # prompt="Parse the reading order of this document.",
        response_format=ResponseFormat.MARKDOWN,
        inference_framework=InferenceFramework.TRANSFORMERS,
        transformers_model_type=TransformersModelType.AUTOMODEL_IMAGETEXTTOTEXT,
        supported_devices=[AcceleratorDevice.CUDA, AcceleratorDevice.CPU],
        scale=2.0,
        temperature=0.0,
    )

    # Note that this is not the expected way of using the Dolphin model, but it shows the usage of a raw prompt.
    dolphin_oneshot = InlineVlmOptions(
        repo_id="ByteDance/Dolphin",
        prompt="<s>Read text in the image. <Answer/>",
        response_format=ResponseFormat.MARKDOWN,
        inference_framework=InferenceFramework.TRANSFORMERS,
        transformers_model_type=TransformersModelType.AUTOMODEL_IMAGETEXTTOTEXT,
        transformers_prompt_style=TransformersPromptStyle.RAW,
        supported_devices=[AcceleratorDevice.CUDA, AcceleratorDevice.CPU],
        scale=2.0,
        temperature=0.0,
    )

    ## Use VlmPipeline
    pipeline_options = VlmPipelineOptions()
    pipeline_options.generate_page_images = True

    ## On GPU systems, enable flash_attention_2 with CUDA:
    # pipeline_options.accelerator_options.device = AcceleratorDevice.CUDA
    # pipeline_options.accelerator_options.cuda_use_flash_attention2 = True

    vlm_models = [
        ## DocTags / SmolDocling models
        vlm_model_specs.SMOLDOCLING_MLX,
        vlm_model_specs.SMOLDOCLING_TRANSFORMERS,
        ## Markdown models (using MLX framework)
        vlm_model_specs.QWEN25_VL_3B_MLX,
        vlm_model_specs.PIXTRAL_12B_MLX,
        vlm_model_specs.GEMMA3_12B_MLX,
        ## Markdown models (using Transformers framework)
        vlm_model_specs.GRANITE_VISION_TRANSFORMERS,
        vlm_model_specs.PHI4_TRANSFORMERS,
        vlm_model_specs.PIXTRAL_12B_TRANSFORMERS,
        ## More inline models
        dolphin_oneshot,
        llava_qwen,
    ]

    # Remove MLX models if not on Mac
    if sys.platform != "darwin":
        vlm_models = [
            m for m in vlm_models if m.inference_framework != InferenceFramework.MLX
        ]

    rows = []
    for vlm_options in vlm_models:
        pipeline_options.vlm_options = vlm_options

        ## Set up pipeline for PDF or image inputs
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_cls=VlmPipeline,
                    pipeline_options=pipeline_options,
                ),
                InputFormat.IMAGE: PdfFormatOption(
                    pipeline_cls=VlmPipeline,
                    pipeline_options=pipeline_options,
                ),
            },
        )

        row = convert(sources=sources, converter=converter)
        rows.append(row)

        print(
            tabulate(
                rows, headers=["source", "model_id", "framework", "num_pages", "time"]
            )
        )

        print("see if memory gets released ...")
        time.sleep(10)



## ASR pipeline with Whisper
from pathlib import Path
from docling_core.types.doc import DoclingDocument
from docling.datamodel import asr_model_specs
from docling.datamodel.base_models import ConversionStatus, InputFormat
from docling.datamodel.document import ConversionResult
from docling.datamodel.pipeline_options import AsrPipelineOptions
from docling.document_converter import AudioFormatOption, DocumentConverter
from docling.pipeline.asr_pipeline import AsrPipeline
def get_asr_converter():
    """Create a DocumentConverter configured for ASR with whisper_turbo model."""
    pipeline_options = AsrPipelineOptions()
    pipeline_options.asr_options = asr_model_specs.WHISPER_TURBO

    converter = DocumentConverter(
        format_options={
            InputFormat.AUDIO: AudioFormatOption(
                pipeline_cls=AsrPipeline,
                pipeline_options=pipeline_options,
            )
        }
    )
    return converter
def asr_pipeline_conversion(audio_path: Path) -> DoclingDocument:
    """ASR pipeline conversion using whisper_turbo"""
    # Check if the test audio file exists
    assert audio_path.exists(), f"Test audio file not found: {audio_path}"

    converter = get_asr_converter()

    # Convert the audio file
    result: ConversionResult = converter.convert(audio_path)

    # Verify conversion was successful
    assert result.status == ConversionStatus.SUCCESS, (
        f"Conversion failed with status: {result.status}"
    )
    return result.document
if __name__ == "__main__":
    audio_path = Path("tests/data/audio/sample_10s.mp3")

    doc = asr_pipeline_conversion(audio_path=audio_path)
    print(doc.export_to_markdown())

    # Expected output:
    #
    # [time: 0.0-4.0]  Shakespeare on Scenery by Oscar Wilde
    #
    # [time: 5.28-9.96]  This is a LibriVox recording. All LibriVox recordings are in the public domain.    


    ## Figure export
import logging
import time
from pathlib import Path
from docling_core.types.doc import ImageRefMode, PictureItem, TableItem
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
_log = logging.getLogger(__name__)
IMAGE_RESOLUTION_SCALE = 2.0
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"
    output_dir = Path("scratch")

    # Important: For operating with page images, we must keep them, otherwise the DocumentConverter
    # will destroy them for cleaning up memory.
    # This is done by setting PdfPipelineOptions.images_scale, which also defines the scale of images.
    # scale=1 correspond of a standard 72 DPI image
    # The PdfPipelineOptions.generate_* are the selectors for the document elements which will be enriched
    # with the image field
    pipeline_options = PdfPipelineOptions()
    pipeline_options.images_scale = IMAGE_RESOLUTION_SCALE
    pipeline_options.generate_page_images = True
    pipeline_options.generate_picture_images = True

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    start_time = time.time()

    conv_res = doc_converter.convert(input_doc_path)

    output_dir.mkdir(parents=True, exist_ok=True)
    doc_filename = conv_res.input.file.stem

    # Save page images
    for page_no, page in conv_res.document.pages.items():
        page_no = page.page_no
        page_image_filename = output_dir / f"{doc_filename}-{page_no}.png"
        with page_image_filename.open("wb") as fp:
            page.image.pil_image.save(fp, format="PNG")

    # Save images of figures and tables
    table_counter = 0
    picture_counter = 0
    for element, _level in conv_res.document.iterate_items():
        if isinstance(element, TableItem):
            table_counter += 1
            element_image_filename = (
                output_dir / f"{doc_filename}-table-{table_counter}.png"
            )
            with element_image_filename.open("wb") as fp:
                element.get_image(conv_res.document).save(fp, "PNG")

        if isinstance(element, PictureItem):
            picture_counter += 1
            element_image_filename = (
                output_dir / f"{doc_filename}-picture-{picture_counter}.png"
            )
            with element_image_filename.open("wb") as fp:
                element.get_image(conv_res.document).save(fp, "PNG")

    # Save markdown with embedded pictures
    md_filename = output_dir / f"{doc_filename}-with-images.md"
    conv_res.document.save_as_markdown(md_filename, image_mode=ImageRefMode.EMBEDDED)

    # Save markdown with externally referenced pictures
    md_filename = output_dir / f"{doc_filename}-with-image-refs.md"
    conv_res.document.save_as_markdown(md_filename, image_mode=ImageRefMode.REFERENCED)

    # Save HTML with externally referenced pictures
    html_filename = output_dir / f"{doc_filename}-with-image-refs.html"
    conv_res.document.save_as_html(html_filename, image_mode=ImageRefMode.REFERENCED)

    end_time = time.time() - start_time

    _log.info(f"Document converted and figures exported in {end_time:.2f} seconds.")
if __name__ == "__main__":
    main()


## Table export
import logging
import time
from pathlib import Path
import pandas as pd
from docling.document_converter import DocumentConverter
_log = logging.getLogger(__name__)
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"
    output_dir = Path("scratch")

    doc_converter = DocumentConverter()

    start_time = time.time()

    conv_res = doc_converter.convert(input_doc_path)

    output_dir.mkdir(parents=True, exist_ok=True)

    doc_filename = conv_res.input.file.stem

    # Export tables
    for table_ix, table in enumerate(conv_res.document.tables):
        table_df: pd.DataFrame = table.export_to_dataframe()
        print(f"## Table {table_ix}")
        print(table_df.to_markdown())

        # Save the table as csv
        element_csv_filename = output_dir / f"{doc_filename}-table-{table_ix + 1}.csv"
        _log.info(f"Saving CSV table to {element_csv_filename}")
        table_df.to_csv(element_csv_filename)

        # Save the table as html
        element_html_filename = output_dir / f"{doc_filename}-table-{table_ix + 1}.html"
        _log.info(f"Saving HTML table to {element_html_filename}")
        with element_html_filename.open("w") as fp:
            fp.write(table.export_to_html(doc=conv_res.document))

    end_time = time.time() - start_time

    _log.info(f"Document converted and tables exported in {end_time:.2f} seconds.")
if __name__ == "__main__":
    main()



## Multimodal export
import datetime
import logging
import time
from pathlib import Path
import pandas as pd
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.utils.export import generate_multimodal_pages
from docling.utils.utils import create_hash
_log = logging.getLogger(__name__)
IMAGE_RESOLUTION_SCALE = 2.0
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"
    output_dir = Path("scratch")

    # Important: For operating with page images, we must keep them, otherwise the DocumentConverter
    # will destroy them for cleaning up memory.
    # This is done by setting AssembleOptions.images_scale, which also defines the scale of images.
    # scale=1 correspond of a standard 72 DPI image
    pipeline_options = PdfPipelineOptions()
    pipeline_options.images_scale = IMAGE_RESOLUTION_SCALE
    pipeline_options.generate_page_images = True

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    start_time = time.time()

    conv_res = doc_converter.convert(input_doc_path)

    output_dir.mkdir(parents=True, exist_ok=True)

    rows = []
    for (
        content_text,
        content_md,
        content_dt,
        page_cells,
        page_segments,
        page,
    ) in generate_multimodal_pages(conv_res):
        dpi = page._default_image_scale * 72

        rows.append(
            {
                "document": conv_res.input.file.name,
                "hash": conv_res.input.document_hash,
                "page_hash": create_hash(
                    conv_res.input.document_hash + ":" + str(page.page_no - 1)
                ),
                "image": {
                    "width": page.image.width,
                    "height": page.image.height,
                    "bytes": page.image.tobytes(),
                },
                "cells": page_cells,
                "contents": content_text,
                "contents_md": content_md,
                "contents_dt": content_dt,
                "segments": page_segments,
                "extra": {
                    "page_num": page.page_no + 1,
                    "width_in_points": page.size.width,
                    "height_in_points": page.size.height,
                    "dpi": dpi,
                },
            }
        )

    # Generate one parquet from all documents
    df_result = pd.json_normalize(rows)
    now = datetime.datetime.now()
    output_filename = output_dir / f"multimodal_{now:%Y-%m-%d_%H%M%S}.parquet"
    df_result.to_parquet(output_filename)

    end_time = time.time() - start_time

    _log.info(
        f"Document converted and multimodal pages generated in {end_time:.2f} seconds."
    )

    # This block demonstrates how the file can be opened with the HF datasets library
    # from datasets import Dataset
    # from PIL import Image
    # multimodal_df = pd.read_parquet(output_filename)

    # # Convert pandas DataFrame to Hugging Face Dataset and load bytes into image
    # dataset = Dataset.from_pandas(multimodal_df)
    # def transforms(examples):
    #     examples["image"] = Image.frombytes('RGB', (examples["image.width"], examples["image.height"]), examples["image.bytes"], 'raw')
    #     return examples
    # dataset = dataset.map(transforms)
if __name__ == "__main__":
    main()


## Force full page OCR
from pathlib import Path
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    TesseractCliOcrOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
def main():
    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"

    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = True
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.do_cell_matching = True

    # Any of the OCR options can be used:EasyOcrOptions, TesseractOcrOptions, TesseractCliOcrOptions, OcrMacOptions(Mac only), RapidOcrOptions
    # ocr_options = EasyOcrOptions(force_full_page_ocr=True)
    # ocr_options = TesseractOcrOptions(force_full_page_ocr=True)
    # ocr_options = OcrMacOptions(force_full_page_ocr=True)
    # ocr_options = RapidOcrOptions(force_full_page_ocr=True)
    ocr_options = TesseractCliOcrOptions(force_full_page_ocr=True)
    pipeline_options.ocr_options = ocr_options

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
            )
        }
    )

    doc = converter.convert(input_doc_path).document
    md = doc.export_to_markdown()
    print(md)
if __name__ == "__main__":
    main()


## Automatic OCR language detection with tesseract
from pathlib import Path
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    TesseractCliOcrOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
def main():
    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"

    # Set lang=["auto"] with a tesseract OCR engine: TesseractOcrOptions, TesseractCliOcrOptions
    # ocr_options = TesseractOcrOptions(lang=["auto"])
    ocr_options = TesseractCliOcrOptions(lang=["auto"])

    pipeline_options = PdfPipelineOptions(
        do_ocr=True, force_full_page_ocr=True, ocr_options=ocr_options
    )

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
            )
        }
    )

    doc = converter.convert(input_doc_path).document
    md = doc.export_to_markdown()
    print(md)
if __name__ == "__main__":
    main()


## RapidOCR with custom OCR models
import os
from huggingface_hub import snapshot_download
from docling.datamodel.pipeline_options import PdfPipelineOptions, RapidOcrOptions
from docling.document_converter import (
    ConversionResult,
    DocumentConverter,
    InputFormat,
    PdfFormatOption,
)
def main():
    # Source document to convert
    source = "https://arxiv.org/pdf/2408.09869v4"

    # Download RappidOCR models from HuggingFace
    print("Downloading RapidOCR models")
    download_path = snapshot_download(repo_id="SWHL/RapidOCR")

    # Setup RapidOcrOptions for english detection
    det_model_path = os.path.join(
        download_path, "PP-OCRv4", "en_PP-OCRv3_det_infer.onnx"
    )
    rec_model_path = os.path.join(
        download_path, "PP-OCRv4", "ch_PP-OCRv4_rec_server_infer.onnx"
    )
    cls_model_path = os.path.join(
        download_path, "PP-OCRv3", "ch_ppocr_mobile_v2.0_cls_train.onnx"
    )
    ocr_options = RapidOcrOptions(
        det_model_path=det_model_path,
        rec_model_path=rec_model_path,
        cls_model_path=cls_model_path,
    )

    pipeline_options = PdfPipelineOptions(
        ocr_options=ocr_options,
    )

    # Convert the document
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
            ),
        },
    )

    conversion_result: ConversionResult = converter.convert(source=source)
    doc = conversion_result.document
    md = doc.export_to_markdown()
    print(md)
if __name__ == "__main__":
    main()


## Accelerator options
from pathlib import Path
from docling.datamodel.accelerator_options import AcceleratorDevice, AcceleratorOptions
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
)
from docling.datamodel.settings import settings
from docling.document_converter import DocumentConverter, PdfFormatOption
def main():
    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"

    # Explicitly set the accelerator
    # accelerator_options = AcceleratorOptions(
    #     num_threads=8, device=AcceleratorDevice.AUTO
    # )
    accelerator_options = AcceleratorOptions(
        num_threads=8, device=AcceleratorDevice.CPU
    )
    # accelerator_options = AcceleratorOptions(
    #     num_threads=8, device=AcceleratorDevice.MPS
    # )
    # accelerator_options = AcceleratorOptions(
    #     num_threads=8, device=AcceleratorDevice.CUDA
    # )

    # easyocr doesnt support cuda:N allocation, defaults to cuda:0
    # accelerator_options = AcceleratorOptions(num_threads=8, device="cuda:1")

    pipeline_options = PdfPipelineOptions()
    pipeline_options.accelerator_options = accelerator_options
    pipeline_options.do_ocr = True
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.do_cell_matching = True

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
            )
        }
    )

    # Enable the profiling to measure the time spent
    settings.debug.profile_pipeline_timings = True

    # Convert the document
    conversion_result = converter.convert(input_doc_path)
    doc = conversion_result.document

    # List with total time per document
    doc_conversion_secs = conversion_result.timings["pipeline_total"].times

    md = doc.export_to_markdown()
    print(md)
    print(f"Conversion secs: {doc_conversion_secs}")
if __name__ == "__main__":
    main()


## Simple translation
import logging
from pathlib import Path
from docling_core.types.doc import ImageRefMode, TableItem, TextItem
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
_log = logging.getLogger(__name__)
IMAGE_RESOLUTION_SCALE = 2.0
# FIXME: put in your favorite translation code ....
def translate(text: str, src: str = "en", dest: str = "de"):
    _log.warning("!!! IMPLEMENT HERE YOUR FAVORITE TRANSLATION CODE!!!")
    # from googletrans import Translator

    # Initialize the translator
    # translator = Translator()

    # Translate text from English to German
    # text = "Hello, how are you?"
    # translated = translator.translate(text, src="en", dest="de")

    return text
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"
    output_dir = Path("scratch")

    # Important: For operating with page images, we must keep them, otherwise the DocumentConverter
    # will destroy them for cleaning up memory.
    # This is done by setting PdfPipelineOptions.images_scale, which also defines the scale of images.
    # scale=1 correspond of a standard 72 DPI image
    # The PdfPipelineOptions.generate_* are the selectors for the document elements which will be enriched
    # with the image field
    pipeline_options = PdfPipelineOptions()
    pipeline_options.images_scale = IMAGE_RESOLUTION_SCALE
    pipeline_options.generate_page_images = True
    pipeline_options.generate_picture_images = True

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    conv_res = doc_converter.convert(input_doc_path)
    conv_doc = conv_res.document
    doc_filename = conv_res.input.file

    # Save markdown with embedded pictures in original text
    md_filename = output_dir / f"{doc_filename}-with-images-orig.md"
    conv_doc.save_as_markdown(md_filename, image_mode=ImageRefMode.EMBEDDED)

    for element, _level in conv_res.document.iterate_items():
        if isinstance(element, TextItem):
            element.orig = element.text
            element.text = translate(text=element.text)

        elif isinstance(element, TableItem):
            for cell in element.data.table_cells:
                cell.text = translate(text=element.text)

    # Save markdown with embedded pictures in translated text
    md_filename = output_dir / f"{doc_filename}-with-images-translated.md"
    conv_doc.save_as_markdown(md_filename, image_mode=ImageRefMode.EMBEDDED)


## Conversion of CSV files
This example shows how to convert CSV files to a structured Docling Document.

Multiple delimiters are supported: , ; | [tab]
Additional CSV dialect settings are detected automatically (e.g. quotes, line separator, escape character)
Example Code
from pathlib import Path

from docling.document_converter import DocumentConverter

# Convert CSV to Docling document
converter = DocumentConverter()
result = converter.convert(Path("../../tests/data/csv/csv-comma.csv"))
output = result.document.export_to_markdown()
This code generates the following output:

Index	Customer Id	First Name	Last Name	Company	City	Country	Phone 1	Phone 2	Email	Subscription Date	Website
1	DD37Cf93aecA6Dc	Sheryl	Baxter	Rasmussen Group	East Leonard	Chile	229.077.5154	397.884.0519x718	zunigavanessa@smith.info	2020-08-24	http://www.stephenson.com/
2	1Ef7b82A4CAAD10	Preston	Lozano, Dr	Vega-Gentry	East Jimmychester	Djibouti	5153435776	686-620-1820x944	vmata@colon.com	2021-04-23	http://www.hobbs.com/
3	6F94879bDAfE5a6	Roy	Berry	Murillo-Perry	Isabelborough	Antigua and Barbuda	+1-539-402-0259	(496)978-3969x58947	beckycarr@hogan.com	2020-03-25	http://www.lawrence.com/
4	5Cef8BFA16c5e3c	Linda	Olsen	Dominguez, Mcmillan and Donovan	Bensonview	Dominican Republic	001-808-617-6467x12895	+1-813-324-8756	stanleyblackwell@benson.org	2020-06-02	http://www.good-lyons.com/
5	053d585Ab6b3159	Joanna	Bender	Martin, Lang and Andrade	West Priscilla	Slovakia (Slovak Republic)	001-234-203-0635x76146	001-199-446-3860x3486	colinalvarado@miles.net	2021-04-17	https://goodwin-ingram.com/


## Conversion of custom XML
Step	Tech	Execution
Embedding	Hugging Face / Sentence Transformers	💻 Local
Vector store	Milvus	💻 Local
Gen AI	Hugging Face Inference API	🌐 Remote
Overview
This is an example of using Docling for converting structured data (XML) into a unified document representation format, DoclingDocument, and leverage its riched structured content for RAG applications.

Data used in this example consist of patents from the United States Patent and Trademark Office (USPTO) and medical articles from PubMed Central® (PMC).

In this notebook, we accomplish the following:

Simple conversion of supported XML files in a nutshell
An end-to-end application using public collections of XML files supported by Docling
Setup the API access for generative AI
Fetch the data from USPTO and PubMed Central® sites, using Docling custom backends
Parse, chunk, and index the documents in a vector database
Perform RAG using LlamaIndex Docling extension
For more details on document chunking with Docling, refer to the Chunking documentation. For RAG with Docling and LlamaIndex, also check the example RAG with LlamaIndex.

Simple conversion
The XML file format defines and stores data in a format that is both human-readable and machine-readable. Because of this flexibility, Docling requires custom backend processors to interpret XML definitions and convert them into DoclingDocument objects.

Some public data collections in XML format are already supported by Docling (USTPO patents and PMC articles). In these cases, the document conversion is straightforward and the same as with any other supported format, such as PDF or HTML. The execution example in Simple Conversion is the recommended usage of Docling for a single file:

from docling.document_converter import DocumentConverter

# a sample PMC article:
source = "../../tests/data/jats/elife-56337.nxml"
converter = DocumentConverter()
result = converter.convert(source)
print(result.status)
ConversionStatus.SUCCESS
Once the document is converted, it can be exported to any format supported by Docling. For instance, to markdown (showing here the first lines only):

md_doc = result.document.export_to_markdown()

delim = "\n"
print(delim.join(md_doc.split(delim)[:8]))
# KRAB-zinc finger protein gene expansion in response to active retrotransposons in the murine lineage

Gernot Wolf, Alberto de Iaco, Ming-An Sun, Melania Bruno, Matthew Tinkham, Don Hoang, Apratim Mitra, Sherry Ralls, Didier Trono, Todd S Macfarlan

The Eunice Kennedy Shriver National Institute of Child Health and Human Development, The National Institutes of Health, Bethesda, United States; School of Life Sciences, École Polytechnique Fédérale de Lausanne (EPFL), Lausanne, Switzerland

## Abstract

If the XML file is not supported, a ConversionError message will be raised.

from io import BytesIO

from docling.datamodel.base_models import DocumentStream
from docling.exceptions import ConversionError

xml_content = (
    b'<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE docling_test SYSTEM '
    b'"test.dtd"><docling>Random content</docling>'
)
stream = DocumentStream(name="docling_test.xml", stream=BytesIO(xml_content))
try:
    result = converter.convert(stream)
except ConversionError as ce:
    print(ce)
Input document docling_test.xml does not match any allowed format.
File format not allowed: docling_test.xml
You can always refer to the Usage documentation page for a list of supported formats.

End-to-end application
This section describes a step-by-step application for processing XML files from supported public collections and use them for question-answering.

Setup
Requirements can be installed as shown below. The --no-warn-conflicts argument is meant for Colab's pre-populated Python environment, feel free to remove for stricter usage.

%pip install -q --progress-bar off --no-warn-conflicts llama-index-core llama-index-readers-docling llama-index-node-parser-docling llama-index-embeddings-huggingface llama-index-llms-huggingface-api llama-index-vector-stores-milvus llama-index-readers-file python-dotenv
Note: you may need to restart the kernel to use updated packages.
This notebook uses HuggingFace's Inference API. For an increased LLM quota, a token can be provided via the environment variable HF_TOKEN.

If you're running this notebook in Google Colab, make sure you add your API key as a secret.

import os
from warnings import filterwarnings

from dotenv import load_dotenv


def _get_env_from_colab_or_os(key):
    try:
        from google.colab import userdata

        try:
            return userdata.get(key)
        except userdata.SecretNotFoundError:
            pass
    except ImportError:
        pass
    return os.getenv(key)


load_dotenv()

filterwarnings(action="ignore", category=UserWarning, module="pydantic")
We can now define the main parameters:

from pathlib import Path
from tempfile import mkdtemp

from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.huggingface_api import HuggingFaceInferenceAPI

EMBED_MODEL_ID = "BAAI/bge-small-en-v1.5"
EMBED_MODEL = HuggingFaceEmbedding(model_name=EMBED_MODEL_ID)
TEMP_DIR = Path(mkdtemp())
MILVUS_URI = str(TEMP_DIR / "docling.db")
GEN_MODEL = HuggingFaceInferenceAPI(
    token=_get_env_from_colab_or_os("HF_TOKEN"),
    model_name="mistralai/Mixtral-8x7B-Instruct-v0.1",
)
embed_dim = len(EMBED_MODEL.get_text_embedding("hi"))
# https://github.com/huggingface/transformers/issues/5486:
os.environ["TOKENIZERS_PARALLELISM"] = "false"
Fetch the data
In this notebook we will use XML data from collections supported by Docling:

Medical articles from the PubMed Central® (PMC). They are available in an FTP server as .tar.gz files. Each file contains the full article data in XML format, among other supplementary files like images or spreadsheets.
Patents from the United States Patent and Trademark Office. They are available in the Bulk Data Storage System (BDSS) as zip files. Each zip file may contain several patents in XML format.
The raw files will be downloaded form the source and saved in a temporary directory.

PMC articles
The OA file is a manifest file of all the PMC articles, including the URL path to download the source files. In this notebook we will use as example the article Pathogens spread by high-altitude windborne mosquitoes, which is available in the archive file PMC11703268.tar.gz.

import tarfile
from io import BytesIO

import requests

# PMC article PMC11703268
url: str = "https://ftp.ncbi.nlm.nih.gov/pub/pmc/oa_package/e3/6b/PMC11703268.tar.gz"

print(f"Downloading {url}...")
buf = BytesIO(requests.get(url).content)
print("Extracting and storing the XML file containing the article text...")
with tarfile.open(fileobj=buf, mode="r:gz") as tar_file:
    for tarinfo in tar_file:
        if tarinfo.isreg():
            file_path = Path(tarinfo.name)
            if file_path.suffix == ".nxml":
                with open(TEMP_DIR / file_path.name, "wb") as file_obj:
                    file_obj.write(tar_file.extractfile(tarinfo).read())
                print(f"Stored XML file {file_path.name}")
Downloading https://ftp.ncbi.nlm.nih.gov/pub/pmc/oa_package/e3/6b/PMC11703268.tar.gz...
Extracting and storing the XML file containing the article text...
Stored XML file nihpp-2024.12.26.630351v1.nxml
USPTO patents
Since each USPTO file is a concatenation of several patents, we need to split its content into valid XML pieces. The following code downloads a sample zip file, split its content in sections, and dumps each section as an XML file. For simplicity, this pipeline is shown here in a sequential manner, but it could be parallelized.

import zipfile

# Patent grants from December 17-23, 2024
url: str = (
    "https://bulkdata.uspto.gov/data/patent/grant/redbook/fulltext/2024/ipg241217.zip"
)
XML_SPLITTER: str = '<?xml version="1.0"'
doc_num: int = 0

print(f"Downloading {url}...")
buf = BytesIO(requests.get(url).content)
print("Parsing zip file, splitting into XML sections, and exporting to files...")
with zipfile.ZipFile(buf) as zf:
    res = zf.testzip()
    if res:
        print("Error validating zip file")
    else:
        with zf.open(zf.namelist()[0]) as xf:
            is_patent = False
            patent_buffer = BytesIO()
            for xf_line in xf:
                decoded_line = xf_line.decode(errors="ignore").rstrip()
                xml_index = decoded_line.find(XML_SPLITTER)
                if xml_index != -1:
                    if (
                        xml_index > 0
                    ):  # cases like </sequence-cwu><?xml version="1.0"...
                        patent_buffer.write(xf_line[:xml_index])
                        patent_buffer.write(b"\r\n")
                        xf_line = xf_line[xml_index:]
                    if patent_buffer.getbuffer().nbytes > 0 and is_patent:
                        doc_num += 1
                        patent_id = f"ipg241217-{doc_num}"
                        with open(TEMP_DIR / f"{patent_id}.xml", "wb") as file_obj:
                            file_obj.write(patent_buffer.getbuffer())
                    is_patent = False
                    patent_buffer = BytesIO()
                elif decoded_line.startswith("<!DOCTYPE"):
                    is_patent = True
                patent_buffer.write(xf_line)
Downloading https://bulkdata.uspto.gov/data/patent/grant/redbook/fulltext/2024/ipg241217.zip...
Parsing zip file, splitting into XML sections, and exporting to files...
print(f"Fetched and exported {doc_num} documents.")
Fetched and exported 4014 documents.
Using the backend converter (optional)
The custom backend converters PubMedDocumentBackend and PatentUsptoDocumentBackend aim at handling the parsing of PMC articles and USPTO patents, respectively.
As any other backends, you can leverage the function is_valid() to check if the input document is supported by the this backend.
Note that some XML sections in the original USPTO zip file may not represent patents, like sequence listings, and therefore they will show as invalid by the backend.
from tqdm.notebook import tqdm

from docling.backend.xml.jats_backend import JatsDocumentBackend
from docling.backend.xml.uspto_backend import PatentUsptoDocumentBackend
from docling.datamodel.base_models import InputFormat
from docling.datamodel.document import InputDocument

# check PMC
in_doc = InputDocument(
    path_or_stream=TEMP_DIR / "nihpp-2024.12.26.630351v1.nxml",
    format=InputFormat.XML_JATS,
    backend=JatsDocumentBackend,
)
backend = JatsDocumentBackend(
    in_doc=in_doc, path_or_stream=TEMP_DIR / "nihpp-2024.12.26.630351v1.nxml"
)
print(f"Document {in_doc.file.name} is a valid PMC article? {backend.is_valid()}")

# check USPTO
in_doc = InputDocument(
    path_or_stream=TEMP_DIR / "ipg241217-1.xml",
    format=InputFormat.XML_USPTO,
    backend=PatentUsptoDocumentBackend,
)
backend = PatentUsptoDocumentBackend(
    in_doc=in_doc, path_or_stream=TEMP_DIR / "ipg241217-1.xml"
)
print(f"Document {in_doc.file.name} is a valid patent? {backend.is_valid()}")

patent_valid = 0
pbar = tqdm(TEMP_DIR.glob("*.xml"), total=doc_num)
for in_path in pbar:
    in_doc = InputDocument(
        path_or_stream=in_path,
        format=InputFormat.XML_USPTO,
        backend=PatentUsptoDocumentBackend,
    )
    backend = PatentUsptoDocumentBackend(in_doc=in_doc, path_or_stream=in_path)
    patent_valid += int(backend.is_valid())

print(f"Found {patent_valid} patents out of {doc_num} XML files.")
Document nihpp-2024.12.26.630351v1.nxml is a valid PMC article? True
Document ipg241217-1.xml is a valid patent? True
  0%|          | 0/4014 [00:00<?, ?it/s]
Found 3928 patents out of 4014 XML files.
Calling the function convert() will convert the input document into a DoclingDocument

doc = backend.convert()

claims_sec = next(item for item in doc.texts if item.text == "CLAIMS")
print(f'Patent "{doc.texts[0].text}" has {len(claims_sec.children)} claims')
Patent "Semiconductor package" has 19 claims
✏️ Tip: in general, there is no need to use the backend converters to parse USPTO or JATS (PubMed) XML files. The generic DocumentConverter object tries to guess the input document format and applies the corresponding backend parser. The conversion shown in Simple Conversion is the recommended usage for the supported XML files.

Parse, chunk, and index
The DoclingDocument format of the converted patents has a rich hierarchical structure, inherited from the original XML document and preserved by the Docling custom backend. In this notebook, we will leverage:

The SimpleDirectoryReader pattern to iterate over the exported XML files created in section Fetch the data.
The LlamaIndex extensions, DoclingReader and DoclingNodeParser, to ingest the patent chunks into a Milvus vector store.
The HierarchicalChunker implementation, which applies a document-based hierarchical chunking, to leverage the patent structures like sections and paragraphs within sections.
Refer to other possible implementations and usage patterns in the Chunking documentation and the RAG with LlamaIndex notebook.

Set the Docling reader and the directory reader
Note that DoclingReader uses Docling's DocumentConverter by default and therefore it will recognize the format of the XML files and leverage the PatentUsptoDocumentBackend automatically.

For demonstration purposes, we limit the scope of the analysis to the first 100 patents.

from llama_index.core import SimpleDirectoryReader
from llama_index.readers.docling import DoclingReader

reader = DoclingReader(export_type=DoclingReader.ExportType.JSON)
dir_reader = SimpleDirectoryReader(
    input_dir=TEMP_DIR,
    exclude=["docling.db", "*.nxml"],
    file_extractor={".xml": reader},
    filename_as_id=True,
    num_files_limit=100,
)
Set the node parser
Note that the HierarchicalChunker is the default chunking implementation of the DoclingNodeParser.

from llama_index.node_parser.docling import DoclingNodeParser

node_parser = DoclingNodeParser()
Set a local Milvus database and run the ingestion
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.vector_stores.milvus import MilvusVectorStore

vector_store = MilvusVectorStore(
    uri=MILVUS_URI,
    dim=embed_dim,
    overwrite=True,
)

index = VectorStoreIndex.from_documents(
    documents=dir_reader.load_data(show_progress=True),
    transformations=[node_parser],
    storage_context=StorageContext.from_defaults(vector_store=vector_store),
    embed_model=EMBED_MODEL,
    show_progress=True,
)
Finally, add the PMC article to the vector store directly from the reader.

index.from_documents(
    documents=reader.load_data(TEMP_DIR / "nihpp-2024.12.26.630351v1.nxml"),
    transformations=[node_parser],
    storage_context=StorageContext.from_defaults(vector_store=vector_store),
    embed_model=EMBED_MODEL,
)
<llama_index.core.indices.vector_store.base.VectorStoreIndex at 0x373a7f7d0>
Question-answering with RAG
The retriever can be used to identify highly relevant documents:

retriever = index.as_retriever(similarity_top_k=3)
results = retriever.retrieve("What patents are related to fitness devices?")

for item in results:
    print(item)
Node ID: 5afd36c0-a739-4a88-a51c-6d0f75358db5
Text: The portable fitness monitoring device 102 may be a device such
as, for example, a mobile phone, a personal digital assistant, a music
file player (e.g. and MP3 player), an intelligent article for wearing
(e.g. a fitness monitoring garment, wrist band, or watch), a dongle
(e.g. a small hardware device that protects software) that includes a
fitn...
Score:  0.772

Node ID: f294b5fd-9089-43cb-8c4e-d1095a634ff1
Text: US Patent Application US 20120071306 entitled “Portable
Multipurpose Whole Body Exercise Device” discloses a portable
multipurpose whole body exercise device which can be used for general
fitness, Pilates-type, core strengthening, therapeutic, and
rehabilitative exercises as well as stretching and physical therapy
and which includes storable acc...
Score:  0.749

Node ID: 8251c7ef-1165-42e1-8c91-c99c8a711bf7
Text: Program products, methods, and systems for providing fitness
monitoring services of the present invention can include any software
application executed by one or more computing devices. A computing
device can be any type of computing device having one or more
processors. For example, a computing device can be a workstation,
mobile device (e.g., ...
Score:  0.744

With the query engine, we can run the question-answering with the RAG pattern on the set of indexed documents.

First, we can prompt the LLM directly:

from llama_index.core.base.llms.types import ChatMessage, MessageRole
from rich.console import Console
from rich.panel import Panel

console = Console()
query = "Do mosquitoes in high altitude expand viruses over large distances?"

usr_msg = ChatMessage(role=MessageRole.USER, content=query)
response = GEN_MODEL.chat(messages=[usr_msg])

console.print(Panel(query, title="Prompt", border_style="bold red"))
console.print(
    Panel(
        response.message.content.strip(),
        title="Generated Content",
        border_style="bold green",
    )
)
╭──────────────────────────────────────────────────── Prompt ─────────────────────────────────────────────────────╮
│ Do mosquitoes in high altitude expand viruses over large distances?                                             │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭─────────────────────────────────────────────── Generated Content ───────────────────────────────────────────────╮
│ Mosquitoes can be found at high altitudes, but their ability to transmit viruses over long distances is not     │
│ primarily dependent on altitude. Mosquitoes are vectors for various diseases, such as malaria, dengue fever,    │
│ and Zika virus, and their transmission range is more closely related to their movement, the presence of a host, │
│ and environmental conditions that support their survival and reproduction.                                      │
│                                                                                                                 │
│ At high altitudes, the environment can be less suitable for mosquitoes due to factors such as colder            │
│ temperatures, lower humidity, and stronger winds, which can limit their population size and distribution.       │
│ However, some species of mosquitoes have adapted to high-altitude environments and can still transmit diseases  │
│ in these areas.                                                                                                 │
│                                                                                                                 │
│ It is possible for mosquitoes to be transported by wind or human activities to higher altitudes, but this is    │
│ not a significant factor in their ability to transmit viruses over long distances. Instead, long-distance       │
│ transmission of viruses is more often associated with human travel and transportation, which can rapidly spread │
│ infected mosquitoes or humans to new areas, leading to the spread of disease.                                   │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Now, we can compare the response when the model is prompted with the indexed PMC article as supporting context:

from llama_index.core.vector_stores import ExactMatchFilter, MetadataFilters

filters = MetadataFilters(
    filters=[
        ExactMatchFilter(key="filename", value="nihpp-2024.12.26.630351v1.nxml"),
    ]
)

query_engine = index.as_query_engine(llm=GEN_MODEL, filter=filters, similarity_top_k=3)
result = query_engine.query(query)

console.print(
    Panel(
        result.response.strip(),
        title="Generated Content with RAG",
        border_style="bold green",
    )
)
╭────────────────────────────────────────── Generated Content with RAG ───────────────────────────────────────────╮
│ Yes, mosquitoes in high altitude can expand viruses over large distances. A study intercepted 1,017 female      │
│ mosquitoes at altitudes of 120-290 m above ground over Mali and Ghana and screened them for infection with      │
│ arboviruses, plasmodia, and filariae. The study found that 3.5% of the mosquitoes were infected with            │
│ flaviviruses, and 1.1% were infectious. Additionally, the study identified 19 mosquito-borne pathogens,         │
│ including three arboviruses that affect humans (dengue, West Nile, and M’Poko viruses). The study provides      │
│ compelling evidence that mosquito-borne pathogens are often spread by windborne mosquitoes at altitude.         |
|_________________________________________________________________________________________________________________|



## Serialization
Overview
In this notebook we showcase the usage of Docling serializers.

Setup
%pip install -qU pip docling docling-core~=2.29 rich
Note: you may need to restart the kernel to use updated packages.
DOC_SOURCE = "https://arxiv.org/pdf/2311.18481"

# we set some start-stop cues for defining an excerpt to print
start_cue = "Copyright © 2024"
stop_cue = "Application of NLP to ESG"
from rich.console import Console
from rich.panel import Panel

console = Console(width=210)  # for preventing Markdown table wrapped rendering


def print_in_console(text):
    console.print(Panel(text))
Basic usage
We first convert the document:

from docling.document_converter import DocumentConverter

converter = DocumentConverter()
doc = converter.convert(source=DOC_SOURCE).document
/Users/pva/work/github.com/DS4SD/docling/.venv/lib/python3.13/site-packages/torch/utils/data/dataloader.py:683: UserWarning: 'pin_memory' argument is set as true but not supported on MPS now, then device pinned memory won't be used.
  warnings.warn(warn_msg)
We can now apply any BaseDocSerializer on the produced document.

👉 Note that, to keep the shown output brief, we only print an excerpt.

E.g. below we apply an HTMLDocSerializer:

from docling_core.transforms.serializer.html import HTMLDocSerializer

serializer = HTMLDocSerializer(doc=doc)
ser_result = serializer.serialize()
ser_text = ser_result.text

# we here only print an excerpt to keep the output brief:
print_in_console(ser_text[ser_text.find(start_cue) : ser_text.find(stop_cue)])
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Copyright © 2024, Association for the Advancement of Artificial Intelligence (www.aaai.org). All rights reserved.</p>                                                                                          │
│ <table><tbody><tr><th>Report</th><th>Question</th><th>Answer</th></tr><tr><td>IBM 2022</td><td>How many hours were spent on employee learning in 2021?</td><td>22.5 million hours</td></tr><tr><td>IBM         │
│ 2022</td><td>What was the rate of fatalities in 2021?</td><td>The rate of fatalities in 2021 was 0.0016.</td></tr><tr><td>IBM 2022</td><td>How many full audits were con- ducted in 2022 in                    │
│ India?</td><td>2</td></tr><tr><td>Starbucks 2022</td><td>What is the percentage of women in the Board of Directors?</td><td>25%</td></tr><tr><td>Starbucks 2022</td><td>What was the total energy con-         │
│ sumption in 2021?</td><td>According to the table, the total energy consumption in 2021 was 2,491,543 MWh.</td></tr><tr><td>Starbucks 2022</td><td>How much packaging material was made from renewable mate-    │
│ rials?</td><td>According to the given data, 31% of packaging materials were made from recycled or renewable materials in FY22.</td></tr></tbody></table>                                                       │
│ <p>Table 1: Example question answers from the ESG reports of IBM and Starbucks using Deep Search DocQA system.</p>                                                                                             │
│ <p>ESG report in our library via our QA conversational assistant. Our assistant generates answers and also presents the information (paragraph or table), in the ESG report, from which it has generated the   │
│ response.</p>                                                                                                                                                                                                  │
│ <h2>Related Work</h2>                                                                                                                                                                                          │
│ <p>The DocQA integrates multiple AI technologies, namely:</p>                                                                                                                                                  │
│ <p>Document Conversion: Converting unstructured documents, such as PDF files, into a machine-readable format is a challenging task in AI. Early strategies for document conversion were based on geometric     │
│ layout analysis (Cattoni et al. 2000; Breuel 2002). Thanks to the availability of large annotated datasets (PubLayNet (Zhong et al. 2019), DocBank (Li et al. 2020), DocLayNet (Pfitzmann et al. 2022; Auer et │
│ al. 2023), deep learning-based methods are routinely used. Modern approaches for recovering the structure of a document can be broadly divided into two categories: image-based or PDF representation-based .  │
│ Imagebased methods usually employ Transformer or CNN architectures on the images of pages (Zhang et al. 2023; Li et al. 2022; Huang et al. 2022). On the other hand, deep learning-</p>                        │
│ <figure><figcaption>Figure 1: System architecture: Simplified sketch of document question-answering pipeline.</figcaption></figure>                                                                            │
│ <p>based language processing methods are applied on the native PDF content (generated by a single PDF printing command) (Auer et al. 2022; Livathinos et al. 2021; Staar et al. 2018).</p>                     │
│ <p>                                                                                                                                                                                                            │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
In the following example, we use a MarkdownDocSerializer:

from docling_core.transforms.serializer.markdown import MarkdownDocSerializer

serializer = MarkdownDocSerializer(doc=doc)
ser_result = serializer.serialize()
ser_text = ser_result.text

print_in_console(ser_text[ser_text.find(start_cue) : ser_text.find(stop_cue)])
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Copyright © 2024, Association for the Advancement of Artificial Intelligence (www.aaai.org). All rights reserved.                                                                                              │
│                                                                                                                                                                                                                │
│ | Report         | Question                                                         | Answer                                                                                                          |        │
│ |----------------|------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|        │
│ | IBM 2022       | How many hours were spent on employee learning in 2021?          | 22.5 million hours                                                                                              |        │
│ | IBM 2022       | What was the rate of fatalities in 2021?                         | The rate of fatalities in 2021 was 0.0016.                                                                      |        │
│ | IBM 2022       | How many full audits were con- ducted in 2022 in India?          | 2                                                                                                               |        │
│ | Starbucks 2022 | What is the percentage of women in the Board of Directors?       | 25%                                                                                                             |        │
│ | Starbucks 2022 | What was the total energy con- sumption in 2021?                 | According to the table, the total energy consumption in 2021 was 2,491,543 MWh.                                 |        │
│ | Starbucks 2022 | How much packaging material was made from renewable mate- rials? | According to the given data, 31% of packaging materials were made from recycled or renewable materials in FY22. |        │
│                                                                                                                                                                                                                │
│ Table 1: Example question answers from the ESG reports of IBM and Starbucks using Deep Search DocQA system.                                                                                                    │
│                                                                                                                                                                                                                │
│ ESG report in our library via our QA conversational assistant. Our assistant generates answers and also presents the information (paragraph or table), in the ESG report, from which it has generated the      │
│ response.                                                                                                                                                                                                      │
│                                                                                                                                                                                                                │
│ ## Related Work                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
│ The DocQA integrates multiple AI technologies, namely:                                                                                                                                                         │
│                                                                                                                                                                                                                │
│ Document Conversion: Converting unstructured documents, such as PDF files, into a machine-readable format is a challenging task in AI. Early strategies for document conversion were based on geometric layout │
│ analysis (Cattoni et al. 2000; Breuel 2002). Thanks to the availability of large annotated datasets (PubLayNet (Zhong et al. 2019), DocBank (Li et al. 2020), DocLayNet (Pfitzmann et al. 2022; Auer et al.    │
│ 2023), deep learning-based methods are routinely used. Modern approaches for recovering the structure of a document can be broadly divided into two categories: image-based or PDF representation-based .      │
│ Imagebased methods usually employ Transformer or CNN architectures on the images of pages (Zhang et al. 2023; Li et al. 2022; Huang et al. 2022). On the other hand, deep learning-                            │
│                                                                                                                                                                                                                │
│ Figure 1: System architecture: Simplified sketch of document question-answering pipeline.                                                                                                                      │
│                                                                                                                                                                                                                │
│ <!-- image -->                                                                                                                                                                                                 │
│                                                                                                                                                                                                                │
│ based language processing methods are applied on the native PDF content (generated by a single PDF printing command) (Auer et al. 2022; Livathinos et al. 2021; Staar et al. 2018).                            │
│                                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Configuring a serializer
Let's now assume we would like to reconfigure the Markdown serialization such that:

it uses a different component serializer, e.g. if we'd prefer tables to be printed in a triplet format (which could potentially improve the vector representation compared to Markdown tables)
it uses specific user-defined parameters, e.g. if we'd prefer a different image placeholder text than the default one
Check out the following configuration and notice the serialization differences in the output further below:

from docling_core.transforms.chunker.hierarchical_chunker import TripletTableSerializer
from docling_core.transforms.serializer.markdown import MarkdownParams

serializer = MarkdownDocSerializer(
    doc=doc,
    table_serializer=TripletTableSerializer(),
    params=MarkdownParams(
        image_placeholder="<!-- demo picture placeholder -->",
        # ...
    ),
)
ser_result = serializer.serialize()
ser_text = ser_result.text

print_in_console(ser_text[ser_text.find(start_cue) : ser_text.find(stop_cue)])
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Copyright © 2024, Association for the Advancement of Artificial Intelligence (www.aaai.org). All rights reserved.                                                                                              │
│                                                                                                                                                                                                                │
│ IBM 2022, Question = How many hours were spent on employee learning in 2021?. IBM 2022, Answer = 22.5 million hours. IBM 2022, Question = What was the rate of fatalities in 2021?. IBM 2022, Answer = The     │
│ rate of fatalities in 2021 was 0.0016.. IBM 2022, Question = How many full audits were con- ducted in 2022 in India?. IBM 2022, Answer = 2. Starbucks 2022, Question = What is the percentage of women in the  │
│ Board of Directors?. Starbucks 2022, Answer = 25%. Starbucks 2022, Question = What was the total energy con- sumption in 2021?. Starbucks 2022, Answer = According to the table, the total energy consumption  │
│ in 2021 was 2,491,543 MWh.. Starbucks 2022, Question = How much packaging material was made from renewable mate- rials?. Starbucks 2022, Answer = According to the given data, 31% of packaging materials were │
│ made from recycled or renewable materials in FY22.                                                                                                                                                             │
│                                                                                                                                                                                                                │
│ Table 1: Example question answers from the ESG reports of IBM and Starbucks using Deep Search DocQA system.                                                                                                    │
│                                                                                                                                                                                                                │
│ ESG report in our library via our QA conversational assistant. Our assistant generates answers and also presents the information (paragraph or table), in the ESG report, from which it has generated the      │
│ response.                                                                                                                                                                                                      │
│                                                                                                                                                                                                                │
│ ## Related Work                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
│ The DocQA integrates multiple AI technologies, namely:                                                                                                                                                         │
│                                                                                                                                                                                                                │
│ Document Conversion: Converting unstructured documents, such as PDF files, into a machine-readable format is a challenging task in AI. Early strategies for document conversion were based on geometric layout │
│ analysis (Cattoni et al. 2000; Breuel 2002). Thanks to the availability of large annotated datasets (PubLayNet (Zhong et al. 2019), DocBank (Li et al. 2020), DocLayNet (Pfitzmann et al. 2022; Auer et al.    │
│ 2023), deep learning-based methods are routinely used. Modern approaches for recovering the structure of a document can be broadly divided into two categories: image-based or PDF representation-based .      │
│ Imagebased methods usually employ Transformer or CNN architectures on the images of pages (Zhang et al. 2023; Li et al. 2022; Huang et al. 2022). On the other hand, deep learning-                            │
│                                                                                                                                                                                                                │
│ Figure 1: System architecture: Simplified sketch of document question-answering pipeline.                                                                                                                      │
│                                                                                                                                                                                                                │
│ <!-- demo picture placeholder -->                                                                                                                                                                              │
│                                                                                                                                                                                                                │
│ based language processing methods are applied on the native PDF content (generated by a single PDF printing command) (Auer et al. 2022; Livathinos et al. 2021; Staar et al. 2018).                            │
│                                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Creating a custom serializer
In the examples above, we were able to reuse existing implementations for our desired serialization strategy, but let's now assume we want to define a custom serialization logic, e.g. we would like picture serialization to include any available picture description (captioning) annotations.

To that end, we first need to revisit our conversion and include all pipeline options needed for picture description enrichment.

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    PictureDescriptionVlmOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption

pipeline_options = PdfPipelineOptions(
    do_picture_description=True,
    picture_description_options=PictureDescriptionVlmOptions(
        repo_id="HuggingFaceTB/SmolVLM-256M-Instruct",
        prompt="Describe this picture in three to five sentences. Be precise and concise.",
    ),
    generate_picture_images=True,
    images_scale=2,
)

converter = DocumentConverter(
    format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
)
doc = converter.convert(source=DOC_SOURCE).document
/Users/pva/work/github.com/DS4SD/docling/.venv/lib/python3.13/site-packages/torch/utils/data/dataloader.py:683: UserWarning: 'pin_memory' argument is set as true but not supported on MPS now, then device pinned memory won't be used.
  warnings.warn(warn_msg)
We can then define our custom picture serializer:

from typing import Any, Optional

from docling_core.transforms.serializer.base import (
    BaseDocSerializer,
    SerializationResult,
)
from docling_core.transforms.serializer.common import create_ser_result
from docling_core.transforms.serializer.markdown import (
    MarkdownParams,
    MarkdownPictureSerializer,
)
from docling_core.types.doc.document import (
    DoclingDocument,
    ImageRefMode,
    PictureDescriptionData,
    PictureItem,
)
from typing_extensions import override


class AnnotationPictureSerializer(MarkdownPictureSerializer):
    @override
    def serialize(
        self,
        *,
        item: PictureItem,
        doc_serializer: BaseDocSerializer,
        doc: DoclingDocument,
        separator: Optional[str] = None,
        **kwargs: Any,
    ) -> SerializationResult:
        text_parts: list[str] = []

        # reusing the existing result:
        parent_res = super().serialize(
            item=item,
            doc_serializer=doc_serializer,
            doc=doc,
            **kwargs,
        )
        text_parts.append(parent_res.text)

        # appending annotations:
        for annotation in item.annotations:
            if isinstance(annotation, PictureDescriptionData):
                text_parts.append(f"<!-- Picture description: {annotation.text} -->")

        text_res = (separator or "\n").join(text_parts)
        return create_ser_result(text=text_res, span_source=item)
Last but not least, we define a new doc serializer which leverages our custom picture serializer.

Notice the picture description annotations in the output below:

serializer = MarkdownDocSerializer(
    doc=doc,
    picture_serializer=AnnotationPictureSerializer(),
    params=MarkdownParams(
        image_mode=ImageRefMode.PLACEHOLDER,
        image_placeholder="",
    ),
)
ser_result = serializer.serialize()
ser_text = ser_result.text

print_in_console(ser_text[ser_text.find(start_cue) : ser_text.find(stop_cue)])
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Copyright © 2024, Association for the Advancement of Artificial Intelligence (www.aaai.org). All rights reserved.                                                                                              │
│                                                                                                                                                                                                                │
│ | Report         | Question                                                         | Answer                                                                                                          |        │
│ |----------------|------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|        │
│ | IBM 2022       | How many hours were spent on employee learning in 2021?          | 22.5 million hours                                                                                              |        │
│ | IBM 2022       | What was the rate of fatalities in 2021?                         | The rate of fatalities in 2021 was 0.0016.                                                                      |        │
│ | IBM 2022       | How many full audits were con- ducted in 2022 in India?          | 2                                                                                                               |        │
│ | Starbucks 2022 | What is the percentage of women in the Board of Directors?       | 25%                                                                                                             |        │
│ | Starbucks 2022 | What was the total energy con- sumption in 2021?                 | According to the table, the total energy consumption in 2021 was 2,491,543 MWh.                                 |        │
│ | Starbucks 2022 | How much packaging material was made from renewable mate- rials? | According to the given data, 31% of packaging materials were made from recycled or renewable materials in FY22. |        │
│                                                                                                                                                                                                                │
│ Table 1: Example question answers from the ESG reports of IBM and Starbucks using Deep Search DocQA system.                                                                                                    │
│                                                                                                                                                                                                                │
│ ESG report in our library via our QA conversational assistant. Our assistant generates answers and also presents the information (paragraph or table), in the ESG report, from which it has generated the      │
│ response.                                                                                                                                                                                                      │
│                                                                                                                                                                                                                │
│ ## Related Work                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
│ The DocQA integrates multiple AI technologies, namely:                                                                                                                                                         │
│                                                                                                                                                                                                                │
│ Document Conversion: Converting unstructured documents, such as PDF files, into a machine-readable format is a challenging task in AI. Early strategies for document conversion were based on geometric layout │
│ analysis (Cattoni et al. 2000; Breuel 2002). Thanks to the availability of large annotated datasets (PubLayNet (Zhong et al. 2019), DocBank (Li et al. 2020), DocLayNet (Pfitzmann et al. 2022; Auer et al.    │
│ 2023), deep learning-based methods are routinely used. Modern approaches for recovering the structure of a document can be broadly divided into two categories: image-based or PDF representation-based .      │
│ Imagebased methods usually employ Transformer or CNN architectures on the images of pages (Zhang et al. 2023; Li et al. 2022; Huang et al. 2022). On the other hand, deep learning-                            │
│                                                                                                                                                                                                                │
│ Figure 1: System architecture: Simplified sketch of document question-answering pipeline.                                                                                                                      │
│ <!-- Picture description: The image depicts a document conversion process. It is a sequence of steps that includes document conversion, information retrieval, and response generation. The document           │
│ conversion step involves converting the document from a text format to a markdown format. The information retrieval step involves retrieving the document from a database or other source. The response        │
│ generation step involves generating a response from the information retrieval step. -->                                                                                                                        │
│                                                                                                                                                                                                                │
│ based language processing methods are applied on the native PDF content (generated by a single PDF printing command) (Auer et al. 2022; Livathinos et al. 2021; Staar et al. 2018).                            │
│                                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯


## Hybrid chunking
Overview
Hybrid chunking applies tokenization-aware refinements on top of document-based hierarchical chunking.

For more details, see here.

Setup
%pip install -qU pip docling transformers
Note: you may need to restart the kernel to use updated packages.
DOC_SOURCE = "../../tests/data/md/wiki.md"
Basic usage
We first convert the document:

from docling.document_converter import DocumentConverter

doc = DocumentConverter().convert(source=DOC_SOURCE).document
For a basic chunking scenario, we can just instantiate a HybridChunker, which will use the default parameters.

from docling.chunking import HybridChunker

chunker = HybridChunker()
chunk_iter = chunker.chunk(dl_doc=doc)
Token indices sequence length is longer than the specified maximum sequence length for this model (531 > 512). Running this sequence through the model will result in indexing errors
👉 NOTE: As you see above, using the HybridChunker can sometimes lead to a warning from the transformers library, however this is a "false alarm" — for details check here.

Note that the text you would typically want to embed is the context-enriched one as returned by the contextualize() method:

for i, chunk in enumerate(chunk_iter):
    print(f"=== {i} ===")
    print(f"chunk.text:\n{f'{chunk.text[:300]}…'!r}")

    enriched_text = chunker.contextualize(chunk=chunk)
    print(f"chunker.contextualize(chunk):\n{f'{enriched_text[:300]}…'!r}")

    print()
=== 0 ===
chunk.text:
'International Business Machines Corporation (using the trademark IBM), nicknamed Big Blue, is an American multinational technology company headquartered in Armonk, New York and present in over 175 countries.\nIt is a publicly traded company and one of the 30 companies in the Dow Jones Industrial Aver…'
chunker.contextualize(chunk):
'IBM\nInternational Business Machines Corporation (using the trademark IBM), nicknamed Big Blue, is an American multinational technology company headquartered in Armonk, New York and present in over 175 countries.\nIt is a publicly traded company and one of the 30 companies in the Dow Jones Industrial …'

=== 1 ===
chunk.text:
'IBM originated with several technological innovations developed and commercialized in the late 19th century. Julius E. Pitrap patented the computing scale in 1885;[17] Alexander Dey invented the dial recorder (1888);[18] Herman Hollerith patented the Electric Tabulating Machine (1889);[19] and Willa…'
chunker.contextualize(chunk):
'IBM\n1910s–1950s\nIBM originated with several technological innovations developed and commercialized in the late 19th century. Julius E. Pitrap patented the computing scale in 1885;[17] Alexander Dey invented the dial recorder (1888);[18] Herman Hollerith patented the Electric Tabulating Machine (1889…'

=== 2 ===
chunk.text:
'Collectively, the companies manufactured a wide array of machinery for sale and lease, ranging from commercial scales and industrial time recorders, meat and cheese slicers, to tabulators and punched cards. Thomas J. Watson, Sr., fired from the National Cash Register Company by John Henry Patterson,…'
chunker.contextualize(chunk):
'IBM\n1910s–1950s\nCollectively, the companies manufactured a wide array of machinery for sale and lease, ranging from commercial scales and industrial time recorders, meat and cheese slicers, to tabulators and punched cards. Thomas J. Watson, Sr., fired from the National Cash Register Company by John …'

=== 3 ===
chunk.text:
'In 1961, IBM developed the SABRE reservation system for American Airlines and introduced the highly successful Selectric typewriter.…'
chunker.contextualize(chunk):
'IBM\n1960s–1980s\nIn 1961, IBM developed the SABRE reservation system for American Airlines and introduced the highly successful Selectric typewriter.…'

Configuring tokenization
For more control on the chunking, we can parametrize tokenization as shown below.

In a RAG / retrieval context, it is important to make sure that the chunker and embedding model are using the same tokenizer.

👉 HuggingFace transformers tokenizers can be used as shown in the following example:

from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
from transformers import AutoTokenizer

from docling.chunking import HybridChunker

EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
MAX_TOKENS = 64  # set to a small number for illustrative purposes

tokenizer = HuggingFaceTokenizer(
    tokenizer=AutoTokenizer.from_pretrained(EMBED_MODEL_ID),
    max_tokens=MAX_TOKENS,  # optional, by default derived from `tokenizer` for HF case
)
👉 Alternatively, OpenAI tokenizers can be used as shown in the example below (uncomment to use — requires installing docling-core[chunking-openai]):

# import tiktoken

# from docling_core.transforms.chunker.tokenizer.openai import OpenAITokenizer

# tokenizer = OpenAITokenizer(
#     tokenizer=tiktoken.encoding_for_model("gpt-4o"),
#     max_tokens=128 * 1024,  # context window length required for OpenAI tokenizers
# )
We can now instantiate our chunker:

chunker = HybridChunker(
    tokenizer=tokenizer,
    merge_peers=True,  # optional, defaults to True
)
chunk_iter = chunker.chunk(dl_doc=doc)
chunks = list(chunk_iter)
Points to notice looking at the output chunks below:

Where possible, we fit the limit of 64 tokens for the metadata-enriched serialization form (see chunk 2)
Where needed, we stop before the limit, e.g. see cases of 63 as it would otherwise run into a comma (see chunk 6)
Where possible, we merge undersized peer chunks (see chunk 0)
"Tail" chunks trailing right after merges may still be undersized (see chunk 8)
for i, chunk in enumerate(chunks):
    print(f"=== {i} ===")
    txt_tokens = tokenizer.count_tokens(chunk.text)
    print(f"chunk.text ({txt_tokens} tokens):\n{chunk.text!r}")

    ser_txt = chunker.contextualize(chunk=chunk)
    ser_tokens = tokenizer.count_tokens(ser_txt)
    print(f"chunker.contextualize(chunk) ({ser_tokens} tokens):\n{ser_txt!r}")

    print()
=== 0 ===
chunk.text (55 tokens):
'International Business Machines Corporation (using the trademark IBM), nicknamed Big Blue, is an American multinational technology company headquartered in Armonk, New York and present in over 175 countries.\nIt is a publicly traded company and one of the 30 companies in the Dow Jones Industrial Average.'
chunker.contextualize(chunk) (56 tokens):
'IBM\nInternational Business Machines Corporation (using the trademark IBM), nicknamed Big Blue, is an American multinational technology company headquartered in Armonk, New York and present in over 175 countries.\nIt is a publicly traded company and one of the 30 companies in the Dow Jones Industrial Average.'

=== 1 ===
chunk.text (45 tokens):
'IBM is the largest industrial research organization in the world, with 19 research facilities across a dozen countries, having held the record for most annual U.S. patents generated by a business for 29 consecutive years from 1993 to 2021.'
chunker.contextualize(chunk) (46 tokens):
'IBM\nIBM is the largest industrial research organization in the world, with 19 research facilities across a dozen countries, having held the record for most annual U.S. patents generated by a business for 29 consecutive years from 1993 to 2021.'

=== 2 ===
chunk.text (63 tokens):
'IBM was founded in 1911 as the Computing-Tabulating-Recording Company (CTR), a holding company of manufacturers of record-keeping and measuring systems. It was renamed "International Business Machines" in 1924 and soon became the leading manufacturer of punch-card tabulating systems. During the 1960s and 1970s, the'
chunker.contextualize(chunk) (64 tokens):
'IBM\nIBM was founded in 1911 as the Computing-Tabulating-Recording Company (CTR), a holding company of manufacturers of record-keeping and measuring systems. It was renamed "International Business Machines" in 1924 and soon became the leading manufacturer of punch-card tabulating systems. During the 1960s and 1970s, the'

=== 3 ===
chunk.text (44 tokens):
"IBM mainframe, exemplified by the System/360, was the world's dominant computing platform, with the company producing 80 percent of computers in the U.S. and 70 percent of computers worldwide.[11]"
chunker.contextualize(chunk) (45 tokens):
"IBM\nIBM mainframe, exemplified by the System/360, was the world's dominant computing platform, with the company producing 80 percent of computers in the U.S. and 70 percent of computers worldwide.[11]"

=== 4 ===
chunk.text (63 tokens):
'IBM debuted in the microcomputer market in 1981 with the IBM Personal Computer, — its DOS software provided by Microsoft, — which became the basis for the majority of personal computers to the present day.[12] The company later also found success in the portable space with the ThinkPad. Since the 1990s,'
chunker.contextualize(chunk) (64 tokens):
'IBM\nIBM debuted in the microcomputer market in 1981 with the IBM Personal Computer, — its DOS software provided by Microsoft, — which became the basis for the majority of personal computers to the present day.[12] The company later also found success in the portable space with the ThinkPad. Since the 1990s,'

=== 5 ===
chunk.text (61 tokens):
'IBM has concentrated on computer services, software, supercomputers, and scientific research; it sold its microcomputer division to Lenovo in 2005. IBM continues to develop mainframes, and its supercomputers have consistently ranked among the most powerful in the world in the 21st century.'
chunker.contextualize(chunk) (62 tokens):
'IBM\nIBM has concentrated on computer services, software, supercomputers, and scientific research; it sold its microcomputer division to Lenovo in 2005. IBM continues to develop mainframes, and its supercomputers have consistently ranked among the most powerful in the world in the 21st century.'

=== 6 ===
chunk.text (62 tokens):
"As one of the world's oldest and largest technology companies, IBM has been responsible for several technological innovations, including the automated teller machine (ATM), dynamic random-access memory (DRAM), the floppy disk, the hard disk drive, the magnetic stripe card, the relational database, the SQL programming"
chunker.contextualize(chunk) (63 tokens):
"IBM\nAs one of the world's oldest and largest technology companies, IBM has been responsible for several technological innovations, including the automated teller machine (ATM), dynamic random-access memory (DRAM), the floppy disk, the hard disk drive, the magnetic stripe card, the relational database, the SQL programming"

=== 7 ===
chunk.text (63 tokens):
'language, and the UPC barcode. The company has made inroads in advanced computer chips, quantum computing, artificial intelligence, and data infrastructure.[13][14][15] IBM employees and alumni have won various recognitions for their scientific research and inventions, including six Nobel Prizes and six Turing'
chunker.contextualize(chunk) (64 tokens):
'IBM\nlanguage, and the UPC barcode. The company has made inroads in advanced computer chips, quantum computing, artificial intelligence, and data infrastructure.[13][14][15] IBM employees and alumni have won various recognitions for their scientific research and inventions, including six Nobel Prizes and six Turing'

=== 8 ===
chunk.text (5 tokens):
'Awards.[16]'
chunker.contextualize(chunk) (6 tokens):
'IBM\nAwards.[16]'

=== 9 ===
chunk.text (56 tokens):
'IBM originated with several technological innovations developed and commercialized in the late 19th century. Julius E. Pitrap patented the computing scale in 1885;[17] Alexander Dey invented the dial recorder (1888);[18] Herman Hollerith patented the Electric Tabulating Machine'
chunker.contextualize(chunk) (60 tokens):
'IBM\n1910s–1950s\nIBM originated with several technological innovations developed and commercialized in the late 19th century. Julius E. Pitrap patented the computing scale in 1885;[17] Alexander Dey invented the dial recorder (1888);[18] Herman Hollerith patented the Electric Tabulating Machine'

=== 10 ===
chunk.text (60 tokens):
"(1889);[19] and Willard Bundy invented a time clock to record workers' arrival and departure times on a paper tape (1889).[20] On June 16, 1911, their four companies were amalgamated in New York State by Charles Ranlett Flint forming a fifth company, the"
chunker.contextualize(chunk) (64 tokens):
"IBM\n1910s–1950s\n(1889);[19] and Willard Bundy invented a time clock to record workers' arrival and departure times on a paper tape (1889).[20] On June 16, 1911, their four companies were amalgamated in New York State by Charles Ranlett Flint forming a fifth company, the"

=== 11 ===
chunk.text (59 tokens):
'Computing-Tabulating-Recording Company (CTR) based in Endicott, New York.[1][21] The five companies had 1,300 employees and offices and plants in Endicott and Binghamton, New York; Dayton, Ohio; Detroit, Michigan; Washington,'
chunker.contextualize(chunk) (63 tokens):
'IBM\n1910s–1950s\nComputing-Tabulating-Recording Company (CTR) based in Endicott, New York.[1][21] The five companies had 1,300 employees and offices and plants in Endicott and Binghamton, New York; Dayton, Ohio; Detroit, Michigan; Washington,'

=== 12 ===
chunk.text (13 tokens):
'D.C.; and Toronto, Canada.[22]'
chunker.contextualize(chunk) (17 tokens):
'IBM\n1910s–1950s\nD.C.; and Toronto, Canada.[22]'

=== 13 ===
chunk.text (60 tokens):
'Collectively, the companies manufactured a wide array of machinery for sale and lease, ranging from commercial scales and industrial time recorders, meat and cheese slicers, to tabulators and punched cards. Thomas J. Watson, Sr., fired from the National Cash Register Company by John Henry Patterson, called'
chunker.contextualize(chunk) (64 tokens):
'IBM\n1910s–1950s\nCollectively, the companies manufactured a wide array of machinery for sale and lease, ranging from commercial scales and industrial time recorders, meat and cheese slicers, to tabulators and punched cards. Thomas J. Watson, Sr., fired from the National Cash Register Company by John Henry Patterson, called'

=== 14 ===
chunk.text (59 tokens):
"on Flint and, in 1914, was offered a position at CTR.[23] Watson joined CTR as general manager and then, 11 months later, was made President when antitrust cases relating to his time at NCR were resolved.[24] Having learned Patterson's pioneering business"
chunker.contextualize(chunk) (63 tokens):
"IBM\n1910s–1950s\non Flint and, in 1914, was offered a position at CTR.[23] Watson joined CTR as general manager and then, 11 months later, was made President when antitrust cases relating to his time at NCR were resolved.[24] Having learned Patterson's pioneering business"

=== 15 ===
chunk.text (23 tokens):
"practices, Watson proceeded to put the stamp of NCR onto CTR's companies.[23]:\n105"
chunker.contextualize(chunk) (27 tokens):
"IBM\n1910s–1950s\npractices, Watson proceeded to put the stamp of NCR onto CTR's companies.[23]:\n105"

=== 16 ===
chunk.text (59 tokens):
'He implemented sales conventions, "generous sales incentives, a focus on customer service, an insistence on well-groomed, dark-suited salesmen and had an evangelical fervor for instilling company pride and loyalty in every worker".[25][26] His favorite slogan,'
chunker.contextualize(chunk) (63 tokens):
'IBM\n1910s–1950s\nHe implemented sales conventions, "generous sales incentives, a focus on customer service, an insistence on well-groomed, dark-suited salesmen and had an evangelical fervor for instilling company pride and loyalty in every worker".[25][26] His favorite slogan,'

=== 17 ===
chunk.text (60 tokens):
'"THINK", became a mantra for each company\'s employees.[25] During Watson\'s first four years, revenues reached $9 million ($158 million today) and the company\'s operations expanded to Europe, South America, Asia and Australia.[25] Watson never liked the'
chunker.contextualize(chunk) (64 tokens):
'IBM\n1910s–1950s\n"THINK", became a mantra for each company\'s employees.[25] During Watson\'s first four years, revenues reached $9 million ($158 million today) and the company\'s operations expanded to Europe, South America, Asia and Australia.[25] Watson never liked the'

=== 18 ===
chunk.text (57 tokens):
'clumsy hyphenated name "Computing-Tabulating-Recording Company" and chose to replace it with the more expansive title "International Business Machines" which had previously been used as the name of CTR\'s Canadian Division;[27] the name was changed on February 14,'
chunker.contextualize(chunk) (61 tokens):
'IBM\n1910s–1950s\nclumsy hyphenated name "Computing-Tabulating-Recording Company" and chose to replace it with the more expansive title "International Business Machines" which had previously been used as the name of CTR\'s Canadian Division;[27] the name was changed on February 14,'

=== 19 ===
chunk.text (21 tokens):
'1924.[28] By 1933, most of the subsidiaries had been merged into one company, IBM.'
chunker.contextualize(chunk) (25 tokens):
'IBM\n1910s–1950s\n1924.[28] By 1933, most of the subsidiaries had been merged into one company, IBM.'

=== 20 ===
chunk.text (22 tokens):
'In 1961, IBM developed the SABRE reservation system for American Airlines and introduced the highly successful Selectric typewriter.'
chunker.contextualize(chunk) (26 tokens):
'IBM\n1960s–1980s\nIn 1961, IBM developed the SABRE reservation system for American Airlines and introduced the highly successful Selectric typewriter.'



## Advanced chunking & serialization
Overview
In this notebook we show how to customize the serialization strategies that come into play during chunking.

Setup
We will work with a document that contains some picture annotations:

from docling_core.types.doc.document import DoclingDocument

SOURCE = "./data/2408.09869v3_enriched.json"

doc = DoclingDocument.load_from_json(SOURCE)
Below we define the chunker (for more details check out Hybrid Chunking):

from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling_core.transforms.chunker.tokenizer.base import BaseTokenizer
from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
from transformers import AutoTokenizer

EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"

tokenizer: BaseTokenizer = HuggingFaceTokenizer(
    tokenizer=AutoTokenizer.from_pretrained(EMBED_MODEL_ID),
)
chunker = HybridChunker(tokenizer=tokenizer)
print(f"{tokenizer.get_max_tokens()=}")
tokenizer.get_max_tokens()=512
Defining some helper methods:

from typing import Iterable, Optional

from docling_core.transforms.chunker.base import BaseChunk
from docling_core.transforms.chunker.hierarchical_chunker import DocChunk
from docling_core.types.doc.labels import DocItemLabel
from rich.console import Console
from rich.panel import Panel

console = Console(
    width=200,  # for getting Markdown tables rendered nicely
)


def find_n_th_chunk_with_label(
    iter: Iterable[BaseChunk], n: int, label: DocItemLabel
) -> Optional[DocChunk]:
    num_found = -1
    for i, chunk in enumerate(iter):
        doc_chunk = DocChunk.model_validate(chunk)
        for it in doc_chunk.meta.doc_items:
            if it.label == label:
                num_found += 1
                if num_found == n:
                    return i, chunk
    return None, None


def print_chunk(chunks, chunk_pos):
    chunk = chunks[chunk_pos]
    ctx_text = chunker.contextualize(chunk=chunk)
    num_tokens = tokenizer.count_tokens(text=ctx_text)
    doc_items_refs = [it.self_ref for it in chunk.meta.doc_items]
    title = f"{chunk_pos=} {num_tokens=} {doc_items_refs=}"
    console.print(Panel(ctx_text, title=title))
Table serialization
Using the default strategy
Below we inspect the first chunk containing a table — using the default serialization strategy:

chunker = HybridChunker(tokenizer=tokenizer)

chunk_iter = chunker.chunk(dl_doc=doc)

chunks = list(chunk_iter)
i, chunk = find_n_th_chunk_with_label(chunks, n=0, label=DocItemLabel.TABLE)
print_chunk(
    chunks=chunks,
    chunk_pos=i,
)
Token indices sequence length is longer than the specified maximum sequence length for this model (652 > 512). Running this sequence through the model will result in indexing errors
╭────────────────────────────────────────────────────────────── chunk_pos=13 num_tokens=426 doc_items_refs=['#/texts/72', '#/tables/0'] ───────────────────────────────────────────────────────────────╮
│ Docling Technical Report                                                                                                                                                                             │
│ 4 Performance                                                                                                                                                                                        │
│ Table 1: Runtime characteristics of Docling with the standard model pipeline and settings, on our test dataset of 225 pages, on two different systems. OCR is disabled. We show the time-to-solution │
│ (TTS), computed throughput in pages per second, and the peak memory used (resident set size) for both the Docling-native PDF backend and for the pypdfium backend, using 4 and 16 threads.           │
│                                                                                                                                                                                                      │
│ Apple M3 Max, Thread budget. = 4. Apple M3 Max, native backend.TTS = 177 s 167 s. Apple M3 Max, native backend.Pages/s = 1.27 1.34. Apple M3 Max, native backend.Mem = 6.20 GB. Apple M3 Max,        │
│ pypdfium backend.TTS = 103 s 92 s. Apple M3 Max, pypdfium backend.Pages/s = 2.18 2.45. Apple M3 Max, pypdfium backend.Mem = 2.56 GB. (16 cores) Intel(R) Xeon E5-2690, Thread budget. = 16 4 16. (16 │
│ cores) Intel(R) Xeon E5-2690, native backend.TTS = 375 s 244 s. (16 cores) Intel(R) Xeon E5-2690, native backend.Pages/s = 0.60 0.92. (16 cores) Intel(R) Xeon E5-2690, native backend.Mem = 6.16    │
│ GB. (16 cores) Intel(R) Xeon E5-2690, pypdfium backend.TTS = 239 s 143 s. (16 cores) Intel(R) Xeon E5-2690, pypdfium backend.Pages/s = 0.94 1.57. (16 cores) Intel(R) Xeon E5-2690, pypdfium         │
│ backend.Mem = 2.42 GB                                                                                                                                                                                │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
INFO: As you see above, using the HybridChunker can sometimes lead to a warning from the transformers library, however this is a "false alarm" — for details check here.
Configuring a different strategy
We can configure a different serialization strategy. In the example below, we specify a different table serializer that serializes tables to Markdown instead of the triplet notation used by default:

from docling_core.transforms.chunker.hierarchical_chunker import (
    ChunkingDocSerializer,
    ChunkingSerializerProvider,
)
from docling_core.transforms.serializer.markdown import MarkdownTableSerializer


class MDTableSerializerProvider(ChunkingSerializerProvider):
    def get_serializer(self, doc):
        return ChunkingDocSerializer(
            doc=doc,
            table_serializer=MarkdownTableSerializer(),  # configuring a different table serializer
        )


chunker = HybridChunker(
    tokenizer=tokenizer,
    serializer_provider=MDTableSerializerProvider(),
)

chunk_iter = chunker.chunk(dl_doc=doc)

chunks = list(chunk_iter)
i, chunk = find_n_th_chunk_with_label(chunks, n=0, label=DocItemLabel.TABLE)
print_chunk(
    chunks=chunks,
    chunk_pos=i,
)
╭────────────────────────────────────────────────────────────── chunk_pos=13 num_tokens=431 doc_items_refs=['#/texts/72', '#/tables/0'] ───────────────────────────────────────────────────────────────╮
│ Docling Technical Report                                                                                                                                                                             │
│ 4 Performance                                                                                                                                                                                        │
│ Table 1: Runtime characteristics of Docling with the standard model pipeline and settings, on our test dataset of 225 pages, on two different systems. OCR is disabled. We show the time-to-solution │
│ (TTS), computed throughput in pages per second, and the peak memory used (resident set size) for both the Docling-native PDF backend and for the pypdfium backend, using 4 and 16 threads.           │
│                                                                                                                                                                                                      │
│ | CPU                              | Thread budget   | native backend   | native backend   | native backend   | pypdfium backend   | pypdfium backend   | pypdfium backend   |                       │
│ |----------------------------------|-----------------|------------------|------------------|------------------|--------------------|--------------------|--------------------|                       │
│ |                                  |                 | TTS              | Pages/s          | Mem              | TTS                | Pages/s            | Mem                |                       │
│ | Apple M3 Max                     | 4               | 177 s 167 s      | 1.27 1.34        | 6.20 GB          | 103 s 92 s         | 2.18 2.45          | 2.56 GB            |                       │
│ | (16 cores) Intel(R) Xeon E5-2690 | 16 4 16         | 375 s 244 s      | 0.60 0.92        | 6.16 GB          | 239 s 143 s        | 0.94 1.57          | 2.42 GB            |                       │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Picture serialization
Using the default strategy
Below we inspect the first chunk containing a picture.

Even when using the default strategy, we can modify the relevant parameters, e.g. which placeholder is used for pictures:

from docling_core.transforms.serializer.markdown import MarkdownParams


class ImgPlaceholderSerializerProvider(ChunkingSerializerProvider):
    def get_serializer(self, doc):
        return ChunkingDocSerializer(
            doc=doc,
            params=MarkdownParams(
                image_placeholder="<!-- image -->",
            ),
        )


chunker = HybridChunker(
    tokenizer=tokenizer,
    serializer_provider=ImgPlaceholderSerializerProvider(),
)

chunk_iter = chunker.chunk(dl_doc=doc)

chunks = list(chunk_iter)
i, chunk = find_n_th_chunk_with_label(chunks, n=0, label=DocItemLabel.PICTURE)
print_chunk(
    chunks=chunks,
    chunk_pos=i,
)
╭───────────────────────────────────────────────── chunk_pos=0 num_tokens=117 doc_items_refs=['#/pictures/0', '#/texts/2', '#/texts/3', '#/texts/4'] ──────────────────────────────────────────────────╮
│ Docling Technical Report                                                                                                                                                                             │
│ <!-- image -->                                                                                                                                                                                       │
│ Version 1.0                                                                                                                                                                                          │
│ Christoph Auer Maksym Lysak Ahmed Nassar Michele Dolfi Nikolaos Livathinos Panos Vagenas Cesar Berrospi Ramis Matteo Omenetti Fabian Lindlbauer Kasper Dinkla Lokesh Mishra Yusik Kim Shubham Gupta  │
│ Rafael Teixeira de Lima Valery Weber Lucas Morin Ingmar Meijer Viktor Kuropiatnyk Peter W. J. Staar                                                                                                  │
│ AI4K Group, IBM Research R¨ uschlikon, Switzerland                                                                                                                                                   │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Using a custom strategy
Below we define and use our custom picture serialization strategy which leverages picture annotations:

from typing import Any

from docling_core.transforms.serializer.base import (
    BaseDocSerializer,
    SerializationResult,
)
from docling_core.transforms.serializer.common import create_ser_result
from docling_core.transforms.serializer.markdown import MarkdownPictureSerializer
from docling_core.types.doc.document import (
    PictureClassificationData,
    PictureDescriptionData,
    PictureItem,
    PictureMoleculeData,
)
from typing_extensions import override


class AnnotationPictureSerializer(MarkdownPictureSerializer):
    @override
    def serialize(
        self,
        *,
        item: PictureItem,
        doc_serializer: BaseDocSerializer,
        doc: DoclingDocument,
        **kwargs: Any,
    ) -> SerializationResult:
        text_parts: list[str] = []
        for annotation in item.annotations:
            if isinstance(annotation, PictureClassificationData):
                predicted_class = (
                    annotation.predicted_classes[0].class_name
                    if annotation.predicted_classes
                    else None
                )
                if predicted_class is not None:
                    text_parts.append(f"Picture type: {predicted_class}")
            elif isinstance(annotation, PictureMoleculeData):
                text_parts.append(f"SMILES: {annotation.smi}")
            elif isinstance(annotation, PictureDescriptionData):
                text_parts.append(f"Picture description: {annotation.text}")

        text_res = "\n".join(text_parts)
        text_res = doc_serializer.post_process(text=text_res)
        return create_ser_result(text=text_res, span_source=item)
class ImgAnnotationSerializerProvider(ChunkingSerializerProvider):
    def get_serializer(self, doc: DoclingDocument):
        return ChunkingDocSerializer(
            doc=doc,
            picture_serializer=AnnotationPictureSerializer(),  # configuring a different picture serializer
        )


chunker = HybridChunker(
    tokenizer=tokenizer,
    serializer_provider=ImgAnnotationSerializerProvider(),
)

chunk_iter = chunker.chunk(dl_doc=doc)

chunks = list(chunk_iter)
i, chunk = find_n_th_chunk_with_label(chunks, n=0, label=DocItemLabel.PICTURE)
print_chunk(
    chunks=chunks,
    chunk_pos=i,
)
╭───────────────────────────────────────────────── chunk_pos=0 num_tokens=128 doc_items_refs=['#/pictures/0', '#/texts/2', '#/texts/3', '#/texts/4'] ──────────────────────────────────────────────────╮
│ Docling Technical Report                                                                                                                                                                             │
│ Picture description: In this image we can see a cartoon image of a duck holding a paper.                                                                                                             │
│ Version 1.0                                                                                                                                                                                          │
│ Christoph Auer Maksym Lysak Ahmed Nassar Michele Dolfi Nikolaos Livathinos Panos Vagenas Cesar Berrospi Ramis Matteo Omenetti Fabian Lindlbauer Kasper Dinkla Lokesh Mishra Yusik Kim Shubham Gupta  │
│ Rafael Teixeira de Lima Valery Weber Lucas Morin Ingmar Meijer Viktor Kuropiatnyk Peter W. J. Staar                                                                                                  │
│ AI4K Group, IBM Research R¨ uschlikon, Switzerland                                                                                                                                                   │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯


## RAG with Haystack
Step	Tech	Execution
Embedding	Hugging Face / Sentence Transformers	💻 Local
Vector store	Milvus	💻 Local
Gen AI	Hugging Face Inference API	🌐 Remote
Overview
This example leverages the Haystack Docling extension, along with Milvus-based document store and retriever instances, as well as sentence-transformers embeddings.

The presented DoclingConverter component enables you to:

use various document types in your LLM applications with ease and speed, and
leverage Docling's rich format for advanced, document-native grounding.
DoclingConverter supports two different export modes:

ExportType.MARKDOWN: if you want to capture each input document as a separate Haystack document, or
ExportType.DOC_CHUNKS (default): if you want to have each input document chunked and to then capture each individual chunk as a separate Haystack document downstream.
The example allows to explore both modes via parameter EXPORT_TYPE; depending on the value set, the ingestion and RAG pipelines are then set up accordingly.

Setup
👉 For best conversion speed, use GPU acceleration whenever available; e.g. if running on Colab, use GPU-enabled runtime.
Notebook uses HuggingFace's Inference API; for increased LLM quota, token can be provided via env var HF_TOKEN.
Requirements can be installed as shown below (--no-warn-conflicts meant for Colab's pre-populated Python env; feel free to remove for stricter usage):
%pip install -q --progress-bar off --no-warn-conflicts docling-haystack haystack-ai docling pymilvus milvus-haystack sentence-transformers python-dotenv
Note: you may need to restart the kernel to use updated packages.
import os
from pathlib import Path
from tempfile import mkdtemp

from docling_haystack.converter import ExportType
from dotenv import load_dotenv


def _get_env_from_colab_or_os(key):
    try:
        from google.colab import userdata

        try:
            return userdata.get(key)
        except userdata.SecretNotFoundError:
            pass
    except ImportError:
        pass
    return os.getenv(key)


load_dotenv()
HF_TOKEN = _get_env_from_colab_or_os("HF_TOKEN")
PATHS = ["https://arxiv.org/pdf/2408.09869"]  # Docling Technical Report
EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
GENERATION_MODEL_ID = "mistralai/Mixtral-8x7B-Instruct-v0.1"
EXPORT_TYPE = ExportType.DOC_CHUNKS
QUESTION = "Which are the main AI models in Docling?"
TOP_K = 3
MILVUS_URI = str(Path(mkdtemp()) / "docling.db")
Indexing pipeline
from docling_haystack.converter import DoclingConverter
from haystack import Pipeline
from haystack.components.embedders import (
    SentenceTransformersDocumentEmbedder,
    SentenceTransformersTextEmbedder,
)
from haystack.components.preprocessors import DocumentSplitter
from haystack.components.writers import DocumentWriter
from milvus_haystack import MilvusDocumentStore, MilvusEmbeddingRetriever

from docling.chunking import HybridChunker

document_store = MilvusDocumentStore(
    connection_args={"uri": MILVUS_URI},
    drop_old=True,
    text_field="txt",  # set for preventing conflict with same-name metadata field
)

idx_pipe = Pipeline()
idx_pipe.add_component(
    "converter",
    DoclingConverter(
        export_type=EXPORT_TYPE,
        chunker=HybridChunker(tokenizer=EMBED_MODEL_ID),
    ),
)
idx_pipe.add_component(
    "embedder",
    SentenceTransformersDocumentEmbedder(model=EMBED_MODEL_ID),
)
idx_pipe.add_component("writer", DocumentWriter(document_store=document_store))
if EXPORT_TYPE == ExportType.DOC_CHUNKS:
    idx_pipe.connect("converter", "embedder")
elif EXPORT_TYPE == ExportType.MARKDOWN:
    idx_pipe.add_component(
        "splitter",
        DocumentSplitter(split_by="sentence", split_length=1),
    )
    idx_pipe.connect("converter.documents", "splitter.documents")
    idx_pipe.connect("splitter.documents", "embedder.documents")
else:
    raise ValueError(f"Unexpected export type: {EXPORT_TYPE}")
idx_pipe.connect("embedder", "writer")
idx_pipe.run({"converter": {"paths": PATHS}})
Token indices sequence length is longer than the specified maximum sequence length for this model (1041 > 512). Running this sequence through the model will result in indexing errors
Batches:   0%|          | 0/2 [00:00<?, ?it/s]
{'writer': {'documents_written': 54}}
RAG pipeline
from haystack.components.builders import AnswerBuilder
from haystack.components.builders.prompt_builder import PromptBuilder
from haystack.components.generators import HuggingFaceAPIGenerator
from haystack.utils import Secret

prompt_template = """
    Given these documents, answer the question.
    Documents:
    {% for doc in documents %}
        {{ doc.content }}
    {% endfor %}
    Question: {{query}}
    Answer:
    """

rag_pipe = Pipeline()
rag_pipe.add_component(
    "embedder",
    SentenceTransformersTextEmbedder(model=EMBED_MODEL_ID),
)
rag_pipe.add_component(
    "retriever",
    MilvusEmbeddingRetriever(document_store=document_store, top_k=TOP_K),
)
rag_pipe.add_component("prompt_builder", PromptBuilder(template=prompt_template))
rag_pipe.add_component(
    "llm",
    HuggingFaceAPIGenerator(
        api_type="serverless_inference_api",
        api_params={"model": GENERATION_MODEL_ID},
        token=Secret.from_token(HF_TOKEN) if HF_TOKEN else None,
    ),
)
rag_pipe.add_component("answer_builder", AnswerBuilder())
rag_pipe.connect("embedder.embedding", "retriever")
rag_pipe.connect("retriever", "prompt_builder.documents")
rag_pipe.connect("prompt_builder", "llm")
rag_pipe.connect("llm.replies", "answer_builder.replies")
rag_pipe.connect("llm.meta", "answer_builder.meta")
rag_pipe.connect("retriever", "answer_builder.documents")
rag_res = rag_pipe.run(
    {
        "embedder": {"text": QUESTION},
        "prompt_builder": {"query": QUESTION},
        "answer_builder": {"query": QUESTION},
    }
)
Batches:   0%|          | 0/1 [00:00<?, ?it/s]
/Users/pva/work/github.com/docling-project/docling/.venv/lib/python3.12/site-packages/huggingface_hub/inference/_client.py:2232: FutureWarning: `stop_sequences` is a deprecated argument for `text_generation` task and will be removed in version '0.28.0'. Use `stop` instead.
  warnings.warn(
Below we print out the RAG results. If you have used ExportType.DOC_CHUNKS, notice how the sources contain document-level grounding (e.g. page number or bounding box information):

from docling.chunking import DocChunk

print(f"Question:\n{QUESTION}\n")
print(f"Answer:\n{rag_res['answer_builder']['answers'][0].data.strip()}\n")
print("Sources:")
sources = rag_res["answer_builder"]["answers"][0].documents
for source in sources:
    if EXPORT_TYPE == ExportType.DOC_CHUNKS:
        doc_chunk = DocChunk.model_validate(source.meta["dl_meta"])
        print(f"- text: {doc_chunk.text!r}")
        if doc_chunk.meta.origin:
            print(f"  file: {doc_chunk.meta.origin.filename}")
        if doc_chunk.meta.headings:
            print(f"  section: {' / '.join(doc_chunk.meta.headings)}")
        bbox = doc_chunk.meta.doc_items[0].prov[0].bbox
        print(
            f"  page: {doc_chunk.meta.doc_items[0].prov[0].page_no}, "
            f"bounding box: [{int(bbox.l)}, {int(bbox.t)}, {int(bbox.r)}, {int(bbox.b)}]"
        )
    elif EXPORT_TYPE == ExportType.MARKDOWN:
        print(repr(source.content))
    else:
        raise ValueError(f"Unexpected export type: {EXPORT_TYPE}")
Question:
Which are the main AI models in Docling?

Answer:
The main AI models in Docling are a layout analysis model and TableFormer. The layout analysis model is an accurate object-detector for page elements, while TableFormer is a state-of-the-art table structure recognition model. These models are provided with pre-trained weights and a separate package for the inference code as docling-ibm-models. They are also used in the open-access deepsearch-experience, a cloud-native service for knowledge exploration tasks. Additionally, Docling plans to extend its model library with a figure-classifier model, an equation-recognition model, a code-recognition model, and more in the future.

Sources:
- text: 'As part of Docling, we initially release two highly capable AI models to the open-source community, which have been developed and published recently by our team. The first model is a layout analysis model, an accurate object-detector for page elements [13]. The second model is TableFormer [12, 9], a state-of-the-art table structure recognition model. We provide the pre-trained weights (hosted on huggingface) and a separate package for the inference code as docling-ibm-models . Both models are also powering the open-access deepsearch-experience, our cloud-native service for knowledge exploration tasks.'
  file: 2408.09869v5.pdf
  section: 3.2 AI models
  page: 3, bounding box: [107, 406, 504, 330]
- text: 'Docling implements a linear pipeline of operations, which execute sequentially on each given document (see Fig. 1). Each document is first parsed by a PDF backend, which retrieves the programmatic text tokens, consisting of string content and its coordinates on the page, and also renders a bitmap image of each page to support downstream operations. Then, the standard model pipeline applies a sequence of AI models independently on every page in the document to extract features and content, such as layout and table structures. Finally, the results from all pages are aggregated and passed through a post-processing stage, which augments metadata, detects the document language, infers reading-order and eventually assembles a typed document object which can be serialized to JSON or Markdown.'
  file: 2408.09869v5.pdf
  section: 3 Processing pipeline
  page: 2, bounding box: [107, 273, 504, 176]
- text: 'Docling is designed to allow easy extension of the model library and pipelines. In the future, we plan to extend Docling with several more models, such as a figure-classifier model, an equationrecognition model, a code-recognition model and more. This will help improve the quality of conversion for specific types of content, as well as augment extracted document metadata with additional information. Further investment into testing and optimizing GPU acceleration as well as improving the Docling-native PDF backend are on our roadmap, too.\nWe encourage everyone to propose or implement additional features and models, and will gladly take your inputs and contributions under review . The codebase of Docling is open for use and contribution, under the MIT license agreement and in alignment with our contributing guidelines included in the Docling repository. If you use Docling in your projects, please consider citing this technical report.'
  section: 6 Future work and contributions
  page: 5, bounding box: [106, 323, 504, 258]


## RAG with LangChain
Step	Tech	Execution
Embedding	Hugging Face / Sentence Transformers	💻 Local
Vector store	Milvus	💻 Local
Gen AI	Hugging Face Inference API	🌐 Remote
This example leverages the LangChain Docling integration, along with a Milvus vector store, as well as sentence-transformers embeddings.

The presented DoclingLoader component enables you to:

use various document types in your LLM applications with ease and speed, and
leverage Docling's rich format for advanced, document-native grounding.
DoclingLoader supports two different export modes:

ExportType.MARKDOWN: if you want to capture each input document as a separate LangChain document, or
ExportType.DOC_CHUNKS (default): if you want to have each input document chunked and to then capture each individual chunk as a separate LangChain document downstream.
The example allows exploring both modes via parameter EXPORT_TYPE; depending on the value set, the example pipeline is then set up accordingly.

Setup
👉 For best conversion speed, use GPU acceleration whenever available; e.g. if running on Colab, use GPU-enabled runtime.
Notebook uses HuggingFace's Inference API; for increased LLM quota, token can be provided via env var HF_TOKEN.
Requirements can be installed as shown below (--no-warn-conflicts meant for Colab's pre-populated Python env; feel free to remove for stricter usage):
%pip install -q --progress-bar off --no-warn-conflicts langchain-docling langchain-core langchain-huggingface langchain_milvus langchain python-dotenv
Note: you may need to restart the kernel to use updated packages.
import os
from pathlib import Path
from tempfile import mkdtemp

from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_docling.loader import ExportType


def _get_env_from_colab_or_os(key):
    try:
        from google.colab import userdata

        try:
            return userdata.get(key)
        except userdata.SecretNotFoundError:
            pass
    except ImportError:
        pass
    return os.getenv(key)


load_dotenv()

# https://github.com/huggingface/transformers/issues/5486:
os.environ["TOKENIZERS_PARALLELISM"] = "false"

HF_TOKEN = _get_env_from_colab_or_os("HF_TOKEN")
FILE_PATH = ["https://arxiv.org/pdf/2408.09869"]  # Docling Technical Report
EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
GEN_MODEL_ID = "mistralai/Mixtral-8x7B-Instruct-v0.1"
EXPORT_TYPE = ExportType.DOC_CHUNKS
QUESTION = "Which are the main AI models in Docling?"
PROMPT = PromptTemplate.from_template(
    "Context information is below.\n---------------------\n{context}\n---------------------\nGiven the context information and not prior knowledge, answer the query.\nQuery: {input}\nAnswer:\n",
)
TOP_K = 3
MILVUS_URI = str(Path(mkdtemp()) / "docling.db")
Document loading
Now we can instantiate our loader and load documents.

from langchain_docling import DoclingLoader

from docling.chunking import HybridChunker

loader = DoclingLoader(
    file_path=FILE_PATH,
    export_type=EXPORT_TYPE,
    chunker=HybridChunker(tokenizer=EMBED_MODEL_ID),
)

docs = loader.load()
Token indices sequence length is longer than the specified maximum sequence length for this model (1041 > 512). Running this sequence through the model will result in indexing errors
Note: a message saying "Token indices sequence length is longer than the specified maximum sequence length..." can be ignored in this case — details here.

Determining the splits:

if EXPORT_TYPE == ExportType.DOC_CHUNKS:
    splits = docs
elif EXPORT_TYPE == ExportType.MARKDOWN:
    from langchain_text_splitters import MarkdownHeaderTextSplitter

    splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[
            ("#", "Header_1"),
            ("##", "Header_2"),
            ("###", "Header_3"),
        ],
    )
    splits = [split for doc in docs for split in splitter.split_text(doc.page_content)]
else:
    raise ValueError(f"Unexpected export type: {EXPORT_TYPE}")
Inspecting some sample splits:

for d in splits[:3]:
    print(f"- {d.page_content=}")
print("...")
- d.page_content='arXiv:2408.09869v5  [cs.CL]  9 Dec 2024'
- d.page_content='Docling Technical Report\nVersion 1.0\nChristoph Auer Maksym Lysak Ahmed Nassar Michele Dolfi Nikolaos Livathinos Panos Vagenas Cesar Berrospi Ramis Matteo Omenetti Fabian Lindlbauer Kasper Dinkla Lokesh Mishra Yusik Kim Shubham Gupta Rafael Teixeira de Lima Valery Weber Lucas Morin Ingmar Meijer Viktor Kuropiatnyk Peter W. J. Staar\nAI4K Group, IBM Research R¨uschlikon, Switzerland'
- d.page_content='Abstract\nThis technical report introduces Docling , an easy to use, self-contained, MITlicensed open-source package for PDF document conversion. It is powered by state-of-the-art specialized AI models for layout analysis (DocLayNet) and table structure recognition (TableFormer), and runs efficiently on commodity hardware in a small resource budget. The code interface allows for easy extensibility and addition of new features and models.'
...
Ingestion
import json
from pathlib import Path
from tempfile import mkdtemp

from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_milvus import Milvus

embedding = HuggingFaceEmbeddings(model_name=EMBED_MODEL_ID)


milvus_uri = str(Path(mkdtemp()) / "docling.db")  # or set as needed
vectorstore = Milvus.from_documents(
    documents=splits,
    embedding=embedding,
    collection_name="docling_demo",
    connection_args={"uri": milvus_uri},
    index_params={"index_type": "FLAT"},
    drop_old=True,
)
RAG
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_huggingface import HuggingFaceEndpoint

retriever = vectorstore.as_retriever(search_kwargs={"k": TOP_K})
llm = HuggingFaceEndpoint(
    repo_id=GEN_MODEL_ID,
    huggingfacehub_api_token=HF_TOKEN,
)


def clip_text(text, threshold=100):
    return f"{text[:threshold]}..." if len(text) > threshold else text
Note: Environment variable`HF_TOKEN` is set and is the current active token independently from the token you've just configured.
question_answer_chain = create_stuff_documents_chain(llm, PROMPT)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)
resp_dict = rag_chain.invoke({"input": QUESTION})

clipped_answer = clip_text(resp_dict["answer"], threshold=200)
print(f"Question:\n{resp_dict['input']}\n\nAnswer:\n{clipped_answer}")
for i, doc in enumerate(resp_dict["context"]):
    print()
    print(f"Source {i + 1}:")
    print(f"  text: {json.dumps(clip_text(doc.page_content, threshold=350))}")
    for key in doc.metadata:
        if key != "pk":
            val = doc.metadata.get(key)
            clipped_val = clip_text(val) if isinstance(val, str) else val
            print(f"  {key}: {clipped_val}")
Question:
Which are the main AI models in Docling?

Answer:
Docling initially releases two AI models, a layout analysis model and TableFormer. The layout analysis model is an accurate object-detector for page elements, and TableFormer is a state-of-the-art tab...

Source 1:
  text: "3.2 AI models\nAs part of Docling, we initially release two highly capable AI models to the open-source community, which have been developed and published recently by our team. The first model is a layout analysis model, an accurate object-detector for page elements [13]. The second model is TableFormer [12, 9], a state-of-the-art table structure re..."
  dl_meta: {'schema_name': 'docling_core.transforms.chunker.DocMeta', 'version': '1.0.0', 'doc_items': [{'self_ref': '#/texts/50', 'parent': {'$ref': '#/body'}, 'children': [], 'label': 'text', 'prov': [{'page_no': 3, 'bbox': {'l': 108.0, 't': 405.1419982910156, 'r': 504.00299072265625, 'b': 330.7799987792969, 'coord_origin': 'BOTTOMLEFT'}, 'charspan': [0, 608]}]}], 'headings': ['3.2 AI models'], 'origin': {'mimetype': 'application/pdf', 'binary_hash': 11465328351749295394, 'filename': '2408.09869v5.pdf'}}
  source: https://arxiv.org/pdf/2408.09869

Source 2:
  text: "3 Processing pipeline\nDocling implements a linear pipeline of operations, which execute sequentially on each given document (see Fig. 1). Each document is first parsed by a PDF backend, which retrieves the programmatic text tokens, consisting of string content and its coordinates on the page, and also renders a bitmap image of each page to support ..."
  dl_meta: {'schema_name': 'docling_core.transforms.chunker.DocMeta', 'version': '1.0.0', 'doc_items': [{'self_ref': '#/texts/26', 'parent': {'$ref': '#/body'}, 'children': [], 'label': 'text', 'prov': [{'page_no': 2, 'bbox': {'l': 108.0, 't': 273.01800537109375, 'r': 504.00299072265625, 'b': 176.83799743652344, 'coord_origin': 'BOTTOMLEFT'}, 'charspan': [0, 796]}]}], 'headings': ['3 Processing pipeline'], 'origin': {'mimetype': 'application/pdf', 'binary_hash': 11465328351749295394, 'filename': '2408.09869v5.pdf'}}
  source: https://arxiv.org/pdf/2408.09869

Source 3:
  text: "6 Future work and contributions\nDocling is designed to allow easy extension of the model library and pipelines. In the future, we plan to extend Docling with several more models, such as a figure-classifier model, an equationrecognition model, a code-recognition model and more. This will help improve the quality of conversion for specific types of ..."
  dl_meta: {'schema_name': 'docling_core.transforms.chunker.DocMeta', 'version': '1.0.0', 'doc_items': [{'self_ref': '#/texts/76', 'parent': {'$ref': '#/body'}, 'children': [], 'label': 'text', 'prov': [{'page_no': 5, 'bbox': {'l': 108.0, 't': 322.468994140625, 'r': 504.00299072265625, 'b': 259.0169982910156, 'coord_origin': 'BOTTOMLEFT'}, 'charspan': [0, 543]}]}, {'self_ref': '#/texts/77', 'parent': {'$ref': '#/body'}, 'children': [], 'label': 'text', 'prov': [{'page_no': 5, 'bbox': {'l': 108.0, 't': 251.6540069580078, 'r': 504.00299072265625, 'b': 198.99200439453125, 'coord_origin': 'BOTTOMLEFT'}, 'charspan': [0, 402]}]}], 'headings': ['6 Future work and contributions'], 'origin': {'mimetype': 'application/pdf', 'binary_hash': 11465328351749295394, 'filename': '2408.09869v5.pdf'}}
  source: https://arxiv.org/pdf/2408.09869


## RAG with LlamaIndex
Step	Tech	Execution
Embedding	Hugging Face / Sentence Transformers	💻 Local
Vector store	Milvus	💻 Local
Gen AI	Hugging Face Inference API	🌐 Remote
Overview
This example leverages the official LlamaIndex Docling extension.

Presented extensions DoclingReader and DoclingNodeParser enable you to:

use various document types in your LLM applications with ease and speed, and
leverage Docling's rich format for advanced, document-native grounding.
Setup
👉 For best conversion speed, use GPU acceleration whenever available; e.g. if running on Colab, use GPU-enabled runtime.
Notebook uses HuggingFace's Inference API; for increased LLM quota, token can be provided via env var HF_TOKEN.
Requirements can be installed as shown below (--no-warn-conflicts meant for Colab's pre-populated Python env; feel free to remove for stricter usage):
%pip install -q --progress-bar off --no-warn-conflicts llama-index-core llama-index-readers-docling llama-index-node-parser-docling llama-index-embeddings-huggingface llama-index-llms-huggingface-api llama-index-vector-stores-milvus llama-index-readers-file python-dotenv
Note: you may need to restart the kernel to use updated packages.
import os
from pathlib import Path
from tempfile import mkdtemp
from warnings import filterwarnings

from dotenv import load_dotenv


def _get_env_from_colab_or_os(key):
    try:
        from google.colab import userdata

        try:
            return userdata.get(key)
        except userdata.SecretNotFoundError:
            pass
    except ImportError:
        pass
    return os.getenv(key)


load_dotenv()

filterwarnings(action="ignore", category=UserWarning, module="pydantic")
filterwarnings(action="ignore", category=FutureWarning, module="easyocr")
# https://github.com/huggingface/transformers/issues/5486:
os.environ["TOKENIZERS_PARALLELISM"] = "false"
We can now define the main parameters:

from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.huggingface_api import HuggingFaceInferenceAPI

EMBED_MODEL = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
MILVUS_URI = str(Path(mkdtemp()) / "docling.db")
GEN_MODEL = HuggingFaceInferenceAPI(
    token=_get_env_from_colab_or_os("HF_TOKEN"),
    model_name="mistralai/Mixtral-8x7B-Instruct-v0.1",
)
SOURCE = "https://arxiv.org/pdf/2408.09869"  # Docling Technical Report
QUERY = "Which are the main AI models in Docling?"

embed_dim = len(EMBED_MODEL.get_text_embedding("hi"))
Using Markdown export
To create a simple RAG pipeline, we can:

define a DoclingReader, which by default exports to Markdown, and
use a standard node parser for these Markdown-based docs, e.g. a MarkdownNodeParser
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.core.node_parser import MarkdownNodeParser
from llama_index.readers.docling import DoclingReader
from llama_index.vector_stores.milvus import MilvusVectorStore

reader = DoclingReader()
node_parser = MarkdownNodeParser()

vector_store = MilvusVectorStore(
    uri=str(Path(mkdtemp()) / "docling.db"),  # or set as needed
    dim=embed_dim,
    overwrite=True,
)
index = VectorStoreIndex.from_documents(
    documents=reader.load_data(SOURCE),
    transformations=[node_parser],
    storage_context=StorageContext.from_defaults(vector_store=vector_store),
    embed_model=EMBED_MODEL,
)
result = index.as_query_engine(llm=GEN_MODEL).query(QUERY)
print(f"Q: {QUERY}\nA: {result.response.strip()}\n\nSources:")
display([(n.text, n.metadata) for n in result.source_nodes])
Q: Which are the main AI models in Docling?
A: The main AI models in Docling are a layout analysis model, which is an accurate object-detector for page elements, and TableFormer, a state-of-the-art table structure recognition model.

Sources:
[('3.2 AI models\n\nAs part of Docling, we initially release two highly capable AI models to the open-source community, which have been developed and published recently by our team. The first model is a layout analysis model, an accurate object-detector for page elements [13]. The second model is TableFormer [12, 9], a state-of-the-art table structure recognition model. We provide the pre-trained weights (hosted on huggingface) and a separate package for the inference code as docling-ibm-models . Both models are also powering the open-access deepsearch-experience, our cloud-native service for knowledge exploration tasks.',
  {'Header_2': '3.2 AI models'}),
 ("5 Applications\n\nThanks to the high-quality, richly structured document conversion achieved by Docling, its output qualifies for numerous downstream applications. For example, Docling can provide a base for detailed enterprise document search, passage retrieval or classification use-cases, or support knowledge extraction pipelines, allowing specific treatment of different structures in the document, such as tables, figures, section structure or references. For popular generative AI application patterns, such as retrieval-augmented generation (RAG), we provide quackling , an open-source package which capitalizes on Docling's feature-rich document output to enable document-native optimized vector embedding and chunking. It plugs in seamlessly with LLM frameworks such as LlamaIndex [8]. Since Docling is fast, stable and cheap to run, it also makes for an excellent choice to build document-derived datasets. With its powerful table structure recognition, it provides significant benefit to automated knowledge-base construction [11, 10]. Docling is also integrated within the open IBM data prep kit [6], which implements scalable data transforms to build large-scale multi-modal training datasets.",
  {'Header_2': '5 Applications'})]
Using Docling format
To leverage Docling's rich native format, we:

create a DoclingReader with JSON export type, and
employ a DoclingNodeParser in order to appropriately parse that Docling format.
Notice how the sources now also contain document-level grounding (e.g. page number or bounding box information):

from llama_index.node_parser.docling import DoclingNodeParser

reader = DoclingReader(export_type=DoclingReader.ExportType.JSON)
node_parser = DoclingNodeParser()

vector_store = MilvusVectorStore(
    uri=str(Path(mkdtemp()) / "docling.db"),  # or set as needed
    dim=embed_dim,
    overwrite=True,
)
index = VectorStoreIndex.from_documents(
    documents=reader.load_data(SOURCE),
    transformations=[node_parser],
    storage_context=StorageContext.from_defaults(vector_store=vector_store),
    embed_model=EMBED_MODEL,
)
result = index.as_query_engine(llm=GEN_MODEL).query(QUERY)
print(f"Q: {QUERY}\nA: {result.response.strip()}\n\nSources:")
display([(n.text, n.metadata) for n in result.source_nodes])
Q: Which are the main AI models in Docling?
A: The main AI models in Docling are a layout analysis model and TableFormer. The layout analysis model is an accurate object-detector for page elements, and TableFormer is a state-of-the-art table structure recognition model.

Sources:
[('As part of Docling, we initially release two highly capable AI models to the open-source community, which have been developed and published recently by our team. The first model is a layout analysis model, an accurate object-detector for page elements [13]. The second model is TableFormer [12, 9], a state-of-the-art table structure recognition model. We provide the pre-trained weights (hosted on huggingface) and a separate package for the inference code as docling-ibm-models . Both models are also powering the open-access deepsearch-experience, our cloud-native service for knowledge exploration tasks.',
  {'schema_name': 'docling_core.transforms.chunker.DocMeta',
   'version': '1.0.0',
   'doc_items': [{'self_ref': '#/texts/34',
     'parent': {'$ref': '#/body'},
     'children': [],
     'label': 'text',
     'prov': [{'page_no': 3,
       'bbox': {'l': 107.07593536376953,
        't': 406.1695251464844,
        'r': 504.1148681640625,
        'b': 330.2677307128906,
        'coord_origin': 'BOTTOMLEFT'},
       'charspan': [0, 608]}]}],
   'headings': ['3.2 AI models'],
   'origin': {'mimetype': 'application/pdf',
    'binary_hash': 14981478401387673002,
    'filename': '2408.09869v3.pdf'}}),
 ('With Docling , we open-source a very capable and efficient document conversion tool which builds on the powerful, specialized AI models and datasets for layout analysis and table structure recognition we developed and presented in the recent past [12, 13, 9]. Docling is designed as a simple, self-contained python library with permissive license, running entirely locally on commodity hardware. Its code architecture allows for easy extensibility and addition of new features and models.',
  {'schema_name': 'docling_core.transforms.chunker.DocMeta',
   'version': '1.0.0',
   'doc_items': [{'self_ref': '#/texts/9',
     'parent': {'$ref': '#/body'},
     'children': [],
     'label': 'text',
     'prov': [{'page_no': 1,
       'bbox': {'l': 107.0031967163086,
        't': 136.7283935546875,
        'r': 504.04998779296875,
        'b': 83.30133056640625,
        'coord_origin': 'BOTTOMLEFT'},
       'charspan': [0, 488]}]}],
   'headings': ['1 Introduction'],
   'origin': {'mimetype': 'application/pdf',
    'binary_hash': 14981478401387673002,
    'filename': '2408.09869v3.pdf'}})]
With Simple Directory Reader
To demonstrate this usage pattern, we first set up a test document directory.

from pathlib import Path
from tempfile import mkdtemp

import requests

tmp_dir_path = Path(mkdtemp())
r = requests.get(SOURCE)
with open(tmp_dir_path / f"{Path(SOURCE).name}.pdf", "wb") as out_file:
    out_file.write(r.content)
Using the reader and node_parser definitions from any of the above variants, usage with SimpleDirectoryReader then looks as follows:

from llama_index.core import SimpleDirectoryReader

dir_reader = SimpleDirectoryReader(
    input_dir=tmp_dir_path,
    file_extractor={".pdf": reader},
)

vector_store = MilvusVectorStore(
    uri=str(Path(mkdtemp()) / "docling.db"),  # or set as needed
    dim=embed_dim,
    overwrite=True,
)
index = VectorStoreIndex.from_documents(
    documents=dir_reader.load_data(SOURCE),
    transformations=[node_parser],
    storage_context=StorageContext.from_defaults(vector_store=vector_store),
    embed_model=EMBED_MODEL,
)
result = index.as_query_engine(llm=GEN_MODEL).query(QUERY)
print(f"Q: {QUERY}\nA: {result.response.strip()}\n\nSources:")
display([(n.text, n.metadata) for n in result.source_nodes])
Loading files: 100%|██████████| 1/1 [00:11<00:00, 11.27s/file]
Q: Which are the main AI models in Docling?
A: 1. A layout analysis model, an accurate object-detector for page elements. 2. TableFormer, a state-of-the-art table structure recognition model.

Sources:
[('As part of Docling, we initially release two highly capable AI models to the open-source community, which have been developed and published recently by our team. The first model is a layout analysis model, an accurate object-detector for page elements [13]. The second model is TableFormer [12, 9], a state-of-the-art table structure recognition model. We provide the pre-trained weights (hosted on huggingface) and a separate package for the inference code as docling-ibm-models . Both models are also powering the open-access deepsearch-experience, our cloud-native service for knowledge exploration tasks.',
  {'file_path': '/var/folders/76/4wwfs06x6835kcwj4186c0nc0000gn/T/tmp2ooyusg5/2408.09869.pdf',
   'file_name': '2408.09869.pdf',
   'file_type': 'application/pdf',
   'file_size': 5566574,
   'creation_date': '2024-10-28',
   'last_modified_date': '2024-10-28',
   'schema_name': 'docling_core.transforms.chunker.DocMeta',
   'version': '1.0.0',
   'doc_items': [{'self_ref': '#/texts/34',
     'parent': {'$ref': '#/body'},
     'children': [],
     'label': 'text',
     'prov': [{'page_no': 3,
       'bbox': {'l': 107.07593536376953,
        't': 406.1695251464844,
        'r': 504.1148681640625,
        'b': 330.2677307128906,
        'coord_origin': 'BOTTOMLEFT'},
       'charspan': [0, 608]}]}],
   'headings': ['3.2 AI models'],
   'origin': {'mimetype': 'application/pdf',
    'binary_hash': 14981478401387673002,
    'filename': '2408.09869.pdf'}}),
 ('With Docling , we open-source a very capable and efficient document conversion tool which builds on the powerful, specialized AI models and datasets for layout analysis and table structure recognition we developed and presented in the recent past [12, 13, 9]. Docling is designed as a simple, self-contained python library with permissive license, running entirely locally on commodity hardware. Its code architecture allows for easy extensibility and addition of new features and models.',
  {'file_path': '/var/folders/76/4wwfs06x6835kcwj4186c0nc0000gn/T/tmp2ooyusg5/2408.09869.pdf',
   'file_name': '2408.09869.pdf',
   'file_type': 'application/pdf',
   'file_size': 5566574,
   'creation_date': '2024-10-28',
   'last_modified_date': '2024-10-28',
   'schema_name': 'docling_core.transforms.chunker.DocMeta',
   'version': '1.0.0',
   'doc_items': [{'self_ref': '#/texts/9',
     'parent': {'$ref': '#/body'},
     'children': [],
     'label': 'text',
     'prov': [{'page_no': 1,
       'bbox': {'l': 107.0031967163086,
        't': 136.7283935546875,
        'r': 504.04998779296875,
        'b': 83.30133056640625,
        'coord_origin': 'BOTTOMLEFT'},
       'charspan': [0, 488]}]}],
   'headings': ['1 Introduction'],
   'origin': {'mimetype': 'application/pdf',
    'binary_hash': 14981478401387673002,
    'filename': '2408.09869.pdf'}})]


## Visual grounding
Step	Tech	Execution
Embedding	Hugging Face / Sentence Transformers	💻 Local
Vector store	Milvus	💻 Local
Gen AI	Hugging Face Inference API	🌐 Remote
This example showcases Docling's visual grounding capabilities, which can be combined with any agentic AI / RAG framework.

In this instance, we illustrate these capabilities leveraging the LangChain Docling integration, along with a Milvus vector store, as well as sentence-transformers embeddings.

Setup
👉 For best conversion speed, use GPU acceleration whenever available; e.g. if running on Colab, use GPU-enabled runtime.
Notebook uses HuggingFace's Inference API; for increased LLM quota, token can be provided via env var HF_TOKEN.
Requirements can be installed as shown below (--no-warn-conflicts meant for Colab's pre-populated Python env; feel free to remove for stricter usage):
%pip install -q --progress-bar off --no-warn-conflicts langchain-docling langchain-core langchain-huggingface langchain_milvus langchain matplotlib python-dotenv
Note: you may need to restart the kernel to use updated packages.
import os
from pathlib import Path
from tempfile import mkdtemp

from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_docling.loader import ExportType


def _get_env_from_colab_or_os(key):
    try:
        from google.colab import userdata

        try:
            return userdata.get(key)
        except userdata.SecretNotFoundError:
            pass
    except ImportError:
        pass
    return os.getenv(key)


load_dotenv()

# https://github.com/huggingface/transformers/issues/5486:
os.environ["TOKENIZERS_PARALLELISM"] = "false"

HF_TOKEN = _get_env_from_colab_or_os("HF_TOKEN")
SOURCES = ["https://arxiv.org/pdf/2408.09869"]  # Docling Technical Report
EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
GEN_MODEL_ID = "mistralai/Mixtral-8x7B-Instruct-v0.1"
QUESTION = "Which are the main AI models in Docling?"
PROMPT = PromptTemplate.from_template(
    "Context information is below.\n---------------------\n{context}\n---------------------\nGiven the context information and not prior knowledge, answer the query.\nQuery: {input}\nAnswer:\n",
)
TOP_K = 3
MILVUS_URI = str(Path(mkdtemp()) / "docling.db")
Document store setup
Document loading
We first define our converter, in this case including options for keeping page images (for visual grounding).

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=PdfPipelineOptions(
                generate_page_images=True,
                images_scale=2.0,
            ),
        )
    }
)
We set up a simple doc store for keeping converted documents, as that is needed for visual grounding further below.

doc_store = {}
doc_store_root = Path(mkdtemp())
for source in SOURCES:
    dl_doc = converter.convert(source=source).document
    file_path = Path(doc_store_root / f"{dl_doc.origin.binary_hash}.json")
    dl_doc.save_as_json(file_path)
    doc_store[dl_doc.origin.binary_hash] = file_path
Now we can instantiate our loader and load documents.

from langchain_docling import DoclingLoader

from docling.chunking import HybridChunker

loader = DoclingLoader(
    file_path=SOURCES,
    converter=converter,
    export_type=ExportType.DOC_CHUNKS,
    chunker=HybridChunker(tokenizer=EMBED_MODEL_ID),
)

docs = loader.load()
Token indices sequence length is longer than the specified maximum sequence length for this model (648 > 512). Running this sequence through the model will result in indexing errors
👉 NOTE: As you see above, using the HybridChunker can sometimes lead to a warning from the transformers library, however this is a "false alarm" — for details check here.

Inspecting some sample splits:

for d in docs[:3]:
    print(f"- {d.page_content=}")
print("...")
- d.page_content='Docling Technical Report\nVersion 1.0\nChristoph Auer Maksym Lysak Ahmed Nassar Michele Dolfi Nikolaos Livathinos Panos Vagenas Cesar Berrospi Ramis Matteo Omenetti Fabian Lindlbauer Kasper Dinkla Lokesh Mishra Yusik Kim Shubham Gupta Rafael Teixeira de Lima Valery Weber Lucas Morin Ingmar Meijer Viktor Kuropiatnyk Peter W. J. Staar\nAI4K Group, IBM Research R¨ uschlikon, Switzerland'
- d.page_content='Abstract\nThis technical report introduces Docling , an easy to use, self-contained, MITlicensed open-source package for PDF document conversion. It is powered by state-of-the-art specialized AI models for layout analysis (DocLayNet) and table structure recognition (TableFormer), and runs efficiently on commodity hardware in a small resource budget. The code interface allows for easy extensibility and addition of new features and models.'
- d.page_content='1 Introduction\nConverting PDF documents back into a machine-processable format has been a major challenge for decades due to their huge variability in formats, weak standardization and printing-optimized characteristic, which discards most structural features and metadata. With the advent of LLMs and popular application patterns such as retrieval-augmented generation (RAG), leveraging the rich content embedded in PDFs has become ever more relevant. In the past decade, several powerful document understanding solutions have emerged on the market, most of which are commercial software, cloud offerings [3] and most recently, multi-modal vision-language models. As of today, only a handful of open-source tools cover PDF conversion, leaving a significant feature and quality gap to proprietary solutions.\nWith Docling , we open-source a very capable and efficient document conversion tool which builds on the powerful, specialized AI models and datasets for layout analysis and table structure recognition we developed and presented in the recent past [12, 13, 9]. Docling is designed as a simple, self-contained python library with permissive license, running entirely locally on commodity hardware. Its code architecture allows for easy extensibility and addition of new features and models.\nHere is what Docling delivers today:\n· Converts PDF documents to JSON or Markdown format, stable and lightning fast\n· Understands detailed page layout, reading order, locates figures and recovers table structures\n· Extracts metadata from the document, such as title, authors, references and language\n· Optionally applies OCR, e.g. for scanned PDFs\n· Can be configured to be optimal for batch-mode (i.e high throughput, low time-to-solution) or interactive mode (compromise on efficiency, low time-to-solution)\n· Can leverage different accelerators (GPU, MPS, etc).'
...
Ingestion
import json
from pathlib import Path
from tempfile import mkdtemp

from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_milvus import Milvus

embedding = HuggingFaceEmbeddings(model_name=EMBED_MODEL_ID)


milvus_uri = str(Path(mkdtemp()) / "docling.db")  # or set as needed
vectorstore = Milvus.from_documents(
    documents=docs,
    embedding=embedding,
    collection_name="docling_demo",
    connection_args={"uri": milvus_uri},
    index_params={"index_type": "FLAT"},
    drop_old=True,
)
RAG
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_huggingface import HuggingFaceEndpoint

retriever = vectorstore.as_retriever(search_kwargs={"k": TOP_K})
llm = HuggingFaceEndpoint(
    repo_id=GEN_MODEL_ID,
    huggingfacehub_api_token=HF_TOKEN,
)


def clip_text(text, threshold=100):
    return f"{text[:threshold]}..." if len(text) > threshold else text
Note: Environment variable`HF_TOKEN` is set and is the current active token independently from the token you've just configured.
from docling.chunking import DocMeta
from docling.datamodel.document import DoclingDocument

question_answer_chain = create_stuff_documents_chain(llm, PROMPT)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)
resp_dict = rag_chain.invoke({"input": QUESTION})

clipped_answer = clip_text(resp_dict["answer"], threshold=200)
print(f"Question:\n{resp_dict['input']}\n\nAnswer:\n{clipped_answer}")
/Users/pva/work/github.com/DS4SD/docling/.venv/lib/python3.12/site-packages/huggingface_hub/utils/_deprecation.py:131: FutureWarning: 'post' (from 'huggingface_hub.inference._client') is deprecated and will be removed from version '0.31.0'. Making direct POST requests to the inference server is not supported anymore. Please use task methods instead (e.g. `InferenceClient.chat_completion`). If your use case is not supported, please open an issue in https://github.com/huggingface/huggingface_hub.
  warnings.warn(warning_message, FutureWarning)
Question:
Which are the main AI models in Docling?

Answer:
The main AI models in Docling are:
1. A layout analysis model, an accurate object-detector for page elements.
2. TableFormer, a state-of-the-art table structure recognition model.
Visual grounding
import matplotlib.pyplot as plt
from PIL import ImageDraw

for i, doc in enumerate(resp_dict["context"][:]):
    image_by_page = {}
    print(f"Source {i + 1}:")
    print(f"  text: {json.dumps(clip_text(doc.page_content, threshold=350))}")
    meta = DocMeta.model_validate(doc.metadata["dl_meta"])

    # loading the full DoclingDocument from the document store:
    dl_doc = DoclingDocument.load_from_json(doc_store.get(meta.origin.binary_hash))

    for doc_item in meta.doc_items:
        if doc_item.prov:
            prov = doc_item.prov[0]  # here we only consider the first provenence item
            page_no = prov.page_no
            if img := image_by_page.get(page_no):
                pass
            else:
                page = dl_doc.pages[prov.page_no]
                print(f"  page: {prov.page_no}")
                img = page.image.pil_image
                image_by_page[page_no] = img
            bbox = prov.bbox.to_top_left_origin(page_height=page.size.height)
            bbox = bbox.normalized(page.size)
            thickness = 2
            padding = thickness + 2
            bbox.l = round(bbox.l * img.width - padding)
            bbox.r = round(bbox.r * img.width + padding)
            bbox.t = round(bbox.t * img.height - padding)
            bbox.b = round(bbox.b * img.height + padding)
            draw = ImageDraw.Draw(img)
            draw.rectangle(
                xy=bbox.as_tuple(),
                outline="blue",
                width=thickness,
            )
    for p in image_by_page:
        img = image_by_page[p]
        plt.figure(figsize=[15, 15])
        plt.imshow(img)
        plt.axis("off")
        plt.show()
Source 1:
  text: "3.2 AI models\nAs part of Docling, we initially release two highly capable AI models to the open-source community, which have been developed and published recently by our team. The first model is a layout analysis model, an accurate object-detector for page elements [13]. The second model is TableFormer [12, 9], a state-of-the-art table structure re..."
  page: 3 
No description has been provided for this image
Source 2:
  text: "3 Processing pipeline\nDocling implements a linear pipeline of operations, which execute sequentially on each given document (see Fig. 1). Each document is first parsed by a PDF backend, which retrieves the programmatic text tokens, consisting of string content and its coordinates on the page, and also renders a bitmap image of each page to support ..."
  page: 2
No description has been provided for this image
Source 3:
  text: "6 Future work and contributions\nDocling is designed to allow easy extension of the model library and pipelines. In the future, we plan to extend Docling with several more models, such as a figure-classifier model, an equationrecognition model, a code-recognition model and more. This will help improve the quality of conversion for specific types of ..."
  page: 5
No description has been provided for this image

## Annotate picture with local VLM
Open In Colab

%pip install -q docling[vlm] ipython
Note: you may need to restart the kernel to use updated packages.
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
# The source document
DOC_SOURCE = "https://arxiv.org/pdf/2501.17887"
Describe pictures with Granite Vision
This section will run locally the ibm-granite/granite-vision-3.1-2b-preview model to describe the pictures of the document.

from docling.datamodel.pipeline_options import granite_picture_description

pipeline_options = PdfPipelineOptions()
pipeline_options.do_picture_description = True
pipeline_options.picture_description_options = (
    granite_picture_description  # <-- the model choice
)
pipeline_options.picture_description_options.prompt = (
    "Describe the image in three sentences. Be consise and accurate."
)
pipeline_options.images_scale = 2.0
pipeline_options.generate_picture_images = True

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=pipeline_options,
        )
    }
)
doc = converter.convert(DOC_SOURCE).document
Using a slow image processor as `use_fast` is unset and a slow processor was saved with this model. `use_fast=True` will be the default behavior in v4.48, even if the model was saved with a slow processor. This will result in minor differences in outputs. You'll still be able to use a slow processor with `use_fast=False`.
Loading checkpoint shards:   0%|          | 0/2 [00:00<?, ?it/s]
from docling_core.types.doc.document import PictureDescriptionData
from IPython import display

html_buffer = []
# display the first 5 pictures and their captions and annotations:
for pic in doc.pictures[:5]:
    html_item = (
        f"<h3>Picture <code>{pic.self_ref}</code></h3>"
        f'<img src="{pic.image.uri!s}" /><br />'
        f"<h4>Caption</h4>{pic.caption_text(doc=doc)}<br />"
    )
    for annotation in pic.annotations:
        if not isinstance(annotation, PictureDescriptionData):
            continue
        html_item += (
            f"<h4>Annotations ({annotation.provenance})</h4>{annotation.text}<br />\n"
        )
    html_buffer.append(html_item)
display.HTML("<hr />".join(html_buffer))
Picture #/pictures/0
No description has been provided for this image
Caption
Figure 1: Sketch of Docling's pipelines and usage model. Both PDF pipeline and simple pipeline build up a DoclingDocument representation, which can be further enriched. Downstream applications can utilize Docling's API to inspect, export, or chunk the document for various purposes.
Annotations (ibm-granite/granite-vision-3.1-2b-preview)
In this image we can see a poster with some text and images.
Picture #/pictures/1
No description has been provided for this image
Caption
Figure 2: Dataset categories and sample counts for documents and pages.
Annotations (ibm-granite/granite-vision-3.1-2b-preview)
In this image we can see a pie chart. In the pie chart we can see the categories and the number of documents in each category.
Picture #/pictures/2
No description has been provided for this image
Caption
Figure 3: Distribution of conversion times for all documents, ordered by number of pages in a document, on all system configurations. Every dot represents one document. Log/log scale is used to even the spacing, since both number of pages and conversion times have long-tail distributions.
Annotations (ibm-granite/granite-vision-3.1-2b-preview)
In this image we can see a graph. On the x-axis we can see the number of pages. On the y-axis we can see the seconds.
Picture #/pictures/3
No description has been provided for this image
Caption
Figure 4: Contributions of PDF backend and AI models to the conversion time of a page (in seconds per page). Lower is better. Left: Ranges of time contributions for each model to pages it was applied on (i.e., OCR was applied only on pages with bitmaps, table structure was applied only on pages with tables). Right: Average time contribution to a page in the benchmark dataset (factoring in zero-time contribution for OCR and table structure models on pages without bitmaps or tables) .
Annotations (ibm-granite/granite-vision-3.1-2b-preview)
In this image we can see a bar chart and a line chart. In the bar chart we can see the values of Pdf Parse, OCR, Layout, Table Structure, Page Total and Page. In the line chart we can see the values of Pdf Parse, OCR, Layout, Table Structure, Page Total and Page.
Picture #/pictures/4
No description has been provided for this image
Caption
Figure 5: Conversion time in seconds per page on our dataset in three scenarios, across all assets and system configurations. Lower bars are better. The configuration includes OCR and table structure recognition ( fast table option on Docling and MinerU, hi res in unstructured, as shown in table 1).
Annotations (ibm-granite/granite-vision-3.1-2b-preview)
In this image we can see a bar chart. In the chart we can see the CPU, Max, GPU, and sec/page.
Describe pictures with SmolVLM
This section will run locally the HuggingFaceTB/SmolVLM-256M-Instruct model to describe the pictures of the document.

from docling.datamodel.pipeline_options import smolvlm_picture_description

pipeline_options = PdfPipelineOptions()
pipeline_options.do_picture_description = True
pipeline_options.picture_description_options = (
    smolvlm_picture_description  # <-- the model choice
)
pipeline_options.picture_description_options.prompt = (
    "Describe the image in three sentences. Be consise and accurate."
)
pipeline_options.images_scale = 2.0
pipeline_options.generate_picture_images = True

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=pipeline_options,
        )
    }
)
doc = converter.convert(DOC_SOURCE).document
from docling_core.types.doc.document import PictureDescriptionData
from IPython import display

html_buffer = []
# display the first 5 pictures and their captions and annotations:
for pic in doc.pictures[:5]:
    html_item = (
        f"<h3>Picture <code>{pic.self_ref}</code></h3>"
        f'<img src="{pic.image.uri!s}" /><br />'
        f"<h4>Caption</h4>{pic.caption_text(doc=doc)}<br />"
    )
    for annotation in pic.annotations:
        if not isinstance(annotation, PictureDescriptionData):
            continue
        html_item += (
            f"<h4>Annotations ({annotation.provenance})</h4>{annotation.text}<br />\n"
        )
    html_buffer.append(html_item)
display.HTML("<hr />".join(html_buffer))
Picture #/pictures/0
No description has been provided for this image
Caption
Figure 1: Sketch of Docling's pipelines and usage model. Both PDF pipeline and simple pipeline build up a DoclingDocument representation, which can be further enriched. Downstream applications can utilize Docling's API to inspect, export, or chunk the document for various purposes.
Annotations (HuggingFaceTB/SmolVLM-256M-Instruct)
This is a page that has different types of documents on it.
Picture #/pictures/1
No description has been provided for this image
Caption
Figure 2: Dataset categories and sample counts for documents and pages.
Annotations (HuggingFaceTB/SmolVLM-256M-Instruct)
Here is a page-by-page list of documents per category: - Science - Articles - Law and Regulations - Articles - Misc.
Picture #/pictures/2
No description has been provided for this image
Caption
Figure 3: Distribution of conversion times for all documents, ordered by number of pages in a document, on all system configurations. Every dot represents one document. Log/log scale is used to even the spacing, since both number of pages and conversion times have long-tail distributions.
Annotations (HuggingFaceTB/SmolVLM-256M-Instruct)
The image is a bar chart that shows the number of pages of a website as a function of the number of pages of the website. The x-axis represents the number of pages, ranging from 100 to 10,000. The y-axis represents the number of pages, ranging from 100 to 10,000. The chart is labeled "Number of pages" and has a legend at the top of the chart that indicates the number of pages. The chart shows a clear trend: as the number of pages increases, the number of pages decreases. This is evident from the following points: - The number of pages increases from 100 to 1000. - The number of pages decreases from 1000 to 10,000. - The number of pages increases from 10,000 to 10,000.
Picture #/pictures/3
No description has been provided for this image
Caption
Figure 4: Contributions of PDF backend and AI models to the conversion time of a page (in seconds per page). Lower is better. Left: Ranges of time contributions for each model to pages it was applied on (i.e., OCR was applied only on pages with bitmaps, table structure was applied only on pages with tables). Right: Average time contribution to a page in the benchmark dataset (factoring in zero-time contribution for OCR and table structure models on pages without bitmaps or tables) .
Annotations (HuggingFaceTB/SmolVLM-256M-Instruct)
bar chart with different colored bars representing different data points.
Picture #/pictures/4
No description has been provided for this image
Caption
Figure 5: Conversion time in seconds per page on our dataset in three scenarios, across all assets and system configurations. Lower bars are better. The configuration includes OCR and table structure recognition ( fast table option on Docling and MinerU, hi res in unstructured, as shown in table 1).
Annotations (HuggingFaceTB/SmolVLM-256M-Instruct)
A bar chart with the following information: - The x-axis represents the number of pages, ranging from 0 to 14. - The y-axis represents the page count, ranging from 0 to 14. - The chart has three categories: Marker, Unstructured, and Detailed. - The x-axis is labeled "see/page." - The y-axis is labeled "Page Count." - The chart shows that the Marker category has the highest number of pages, followed by the Unstructured category, and then the Detailed category.
Use other vision models
The examples above can also be reproduced using other vision model. The Docling options PictureDescriptionVlmOptions allows to specify your favorite vision model from the Hugging Face Hub.

from docling.datamodel.pipeline_options import PictureDescriptionVlmOptions

pipeline_options = PdfPipelineOptions()
pipeline_options.do_picture_description = True
pipeline_options.picture_description_options = PictureDescriptionVlmOptions(
    repo_id="",  # <-- add here the Hugging Face repo_id of your favorite VLM
    prompt="Describe the image in three sentences. Be consise and accurate.",
)
pipeline_options.images_scale = 2.0
pipeline_options.generate_picture_images = True

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=pipeline_options,
        )
    }
)

# Uncomment to run:
# doc = converter.convert(DOC_SOURCE).document



## Annotate picture with remote VLM
import logging
import os
from pathlib import Path
import requests
from docling_core.types.doc import PictureItem
from dotenv import load_dotenv
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    PictureDescriptionApiOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
Example of PictureDescriptionApiOptions definitions
Using vLLM
Models can be launched via: $ vllm serve MODEL_NAME

def vllm_local_options(model: str):
    options = PictureDescriptionApiOptions(
        url="http://localhost:8000/v1/chat/completions",
        params=dict(
            model=model,
            seed=42,
            max_completion_tokens=200,
        ),
        prompt="Describe the image in three sentences. Be consise and accurate.",
        timeout=90,
    )
    return options
Using LM Studio
def lms_local_options(model: str):
    options = PictureDescriptionApiOptions(
        url="http://localhost:1234/v1/chat/completions",
        params=dict(
            model=model,
            seed=42,
            max_completion_tokens=200,
        ),
        prompt="Describe the image in three sentences. Be consise and accurate.",
        timeout=90,
    )
    return options
Using a cloud service like IBM watsonx.ai
def watsonx_vlm_options():
    load_dotenv()
    api_key = os.environ.get("WX_API_KEY")
    project_id = os.environ.get("WX_PROJECT_ID")

    def _get_iam_access_token(api_key: str) -> str:
        res = requests.post(
            url="https://iam.cloud.ibm.com/identity/token",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data=f"grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey={api_key}",
        )
        res.raise_for_status()
        api_out = res.json()
        print(f"{api_out=}")
        return api_out["access_token"]

    options = PictureDescriptionApiOptions(
        url="https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29",
        params=dict(
            model_id="ibm/granite-vision-3-2-2b",
            project_id=project_id,
            parameters=dict(
                max_new_tokens=400,
            ),
        ),
        headers={
            "Authorization": "Bearer " + _get_iam_access_token(api_key=api_key),
        },
        prompt="Describe the image in three sentences. Be consise and accurate.",
        timeout=60,
    )
    return options
Usage and conversion
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"

    pipeline_options = PdfPipelineOptions(
        enable_remote_services=True  # <-- this is required!
    )
    pipeline_options.do_picture_description = True

    # The PictureDescriptionApiOptions() allows to interface with APIs supporting
    # the multi-modal chat interface. Here follow a few example on how to configure those.
    #
    # One possibility is self-hosting model, e.g. via VLLM.
    # $ vllm serve MODEL_NAME
    # Then PictureDescriptionApiOptions can point to the localhost endpoint.

    # Example for the Granite Vision model:
    # (uncomment the following lines)
    # pipeline_options.picture_description_options = vllm_local_options(
    #     model="ibm-granite/granite-vision-3.3-2b"
    # )

    # Example for the SmolVLM model:
    # (uncomment the following lines)
    # pipeline_options.picture_description_options = vllm_local_options(
    #     model="HuggingFaceTB/SmolVLM-256M-Instruct"
    # )

    # For using models on LM Studio using the built-in GGUF or MLX runtimes, e.g. the SmolVLM model:
    # (uncomment the following lines)
    pipeline_options.picture_description_options = lms_local_options(
        model="smolvlm-256m-instruct"
    )

    # Another possibility is using online services, e.g. watsonx.ai.
    # Using requires setting the env variables WX_API_KEY and WX_PROJECT_ID.
    # (uncomment the following lines)
    # pipeline_options.picture_description_options = watsonx_vlm_options()

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
            )
        }
    )
    result = doc_converter.convert(input_doc_path)

    for element, _level in result.document.iterate_items():
        if isinstance(element, PictureItem):
            print(
                f"Picture {element.self_ref}\n"
                f"Caption: {element.caption_text(doc=result.document)}\n"
                f"Annotations: {element.annotations}"
            )
if __name__ == "__main__":
    main()


## Figure enrichment
WARNING This example demonstrates only how to develop a new enrichment model. It does not run the actual picture classifier model.

import logging
from collections.abc import Iterable
from pathlib import Path
from typing import Any
from docling_core.types.doc import (
    DoclingDocument,
    NodeItem,
    PictureClassificationClass,
    PictureClassificationData,
    PictureItem,
)
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.models.base_model import BaseEnrichmentModel
from docling.pipeline.standard_pdf_pipeline import StandardPdfPipeline
class ExamplePictureClassifierPipelineOptions(PdfPipelineOptions):
    do_picture_classifer: bool = True
class ExamplePictureClassifierEnrichmentModel(BaseEnrichmentModel):
    def __init__(self, enabled: bool):
        self.enabled = enabled

    def is_processable(self, doc: DoclingDocument, element: NodeItem) -> bool:
        return self.enabled and isinstance(element, PictureItem)

    def __call__(
        self, doc: DoclingDocument, element_batch: Iterable[NodeItem]
    ) -> Iterable[Any]:
        if not self.enabled:
            return

        for element in element_batch:
            assert isinstance(element, PictureItem)

            # uncomment this to interactively visualize the image
            # element.get_image(doc).show()

            element.annotations.append(
                PictureClassificationData(
                    provenance="example_classifier-0.0.1",
                    predicted_classes=[
                        PictureClassificationClass(class_name="dummy", confidence=0.42)
                    ],
                )
            )

            yield element
class ExamplePictureClassifierPipeline(StandardPdfPipeline):
    def __init__(self, pipeline_options: ExamplePictureClassifierPipelineOptions):
        super().__init__(pipeline_options)
        self.pipeline_options: ExamplePictureClassifierPipeline

        self.enrichment_pipe = [
            ExamplePictureClassifierEnrichmentModel(
                enabled=pipeline_options.do_picture_classifer
            )
        ]

    @classmethod
    def get_default_options(cls) -> ExamplePictureClassifierPipelineOptions:
        return ExamplePictureClassifierPipelineOptions()
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"

    pipeline_options = ExamplePictureClassifierPipelineOptions()
    pipeline_options.images_scale = 2.0
    pipeline_options.generate_picture_images = True

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_cls=ExamplePictureClassifierPipeline,
                pipeline_options=pipeline_options,
            )
        }
    )
    result = doc_converter.convert(input_doc_path)

    for element, _level in result.document.iterate_items():
        if isinstance(element, PictureItem):
            print(
                f"The model populated the `data` portion of picture {element.self_ref}:\n{element.annotations}"
            )
if __name__ == "__main__":
    main()

## Formula enrichment
WARNING This example demonstrates only how to develop a new enrichment model. It does not run the actual formula understanding model.

import logging
from collections.abc import Iterable
from pathlib import Path
from docling_core.types.doc import DocItemLabel, DoclingDocument, NodeItem, TextItem
from docling.datamodel.base_models import InputFormat, ItemAndImageEnrichmentElement
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.models.base_model import BaseItemAndImageEnrichmentModel
from docling.pipeline.standard_pdf_pipeline import StandardPdfPipeline
class ExampleFormulaUnderstandingPipelineOptions(PdfPipelineOptions):
    do_formula_understanding: bool = True
# A new enrichment model using both the document element and its image as input
class ExampleFormulaUnderstandingEnrichmentModel(BaseItemAndImageEnrichmentModel):
    images_scale = 2.6

    def __init__(self, enabled: bool):
        self.enabled = enabled

    def is_processable(self, doc: DoclingDocument, element: NodeItem) -> bool:
        return (
            self.enabled
            and isinstance(element, TextItem)
            and element.label == DocItemLabel.FORMULA
        )

    def __call__(
        self,
        doc: DoclingDocument,
        element_batch: Iterable[ItemAndImageEnrichmentElement],
    ) -> Iterable[NodeItem]:
        if not self.enabled:
            return

        for enrich_element in element_batch:
            enrich_element.image.show()

            yield enrich_element.item
# How the pipeline can be extended.
class ExampleFormulaUnderstandingPipeline(StandardPdfPipeline):
    def __init__(self, pipeline_options: ExampleFormulaUnderstandingPipelineOptions):
        super().__init__(pipeline_options)
        self.pipeline_options: ExampleFormulaUnderstandingPipelineOptions

        self.enrichment_pipe = [
            ExampleFormulaUnderstandingEnrichmentModel(
                enabled=self.pipeline_options.do_formula_understanding
            )
        ]

        if self.pipeline_options.do_formula_understanding:
            self.keep_backend = True

    @classmethod
    def get_default_options(cls) -> ExampleFormulaUnderstandingPipelineOptions:
        return ExampleFormulaUnderstandingPipelineOptions()
# Example main. In the final version, we simply have to set do_formula_understanding to true.
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2203.01017v2.pdf"

    pipeline_options = ExampleFormulaUnderstandingPipelineOptions()
    pipeline_options.do_formula_understanding = True

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_cls=ExampleFormulaUnderstandingPipeline,
                pipeline_options=pipeline_options,
            )
        }
    )
    doc_converter.convert(input_doc_path)
if __name__ == "__main__":
    main()


## Enrich DoclingDocument
This example allows to run Docling enrichment models on documents which have been already converted and stored as serialized DoclingDocument JSON files.

Load modules
from pathlib import Path
from typing import Iterable, Optional
from docling_core.types.doc import BoundingBox, DocItem, DoclingDocument, NodeItem
from rich.pretty import pprint
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
from docling.datamodel.accelerator_options import AcceleratorOptions
from docling.datamodel.base_models import InputFormat, ItemAndImageEnrichmentElement
from docling.datamodel.document import InputDocument
from docling.models.base_model import BaseItemAndImageEnrichmentModel
from docling.models.document_picture_classifier import (
    DocumentPictureClassifier,
    DocumentPictureClassifierOptions,
)
from docling.utils.utils import chunkify
Define batch size used for processing
BATCH_SIZE = 4
From DocItem to the model inputs
The following function is responsible for taking an item and applying the required pre-processing for the model. In this case we generate a cropped image from the document backend.

def prepare_element(
    doc: DoclingDocument,
    backend: PyPdfiumDocumentBackend,
    model: BaseItemAndImageEnrichmentModel,
    element: NodeItem,
) -> Optional[ItemAndImageEnrichmentElement]:
    if not model.is_processable(doc=doc, element=element):
        return None

    assert isinstance(element, DocItem)
    element_prov = element.prov[0]

    bbox = element_prov.bbox
    width = bbox.r - bbox.l
    height = bbox.t - bbox.b

    expanded_bbox = BoundingBox(
        l=bbox.l - width * model.expansion_factor,
        t=bbox.t + height * model.expansion_factor,
        r=bbox.r + width * model.expansion_factor,
        b=bbox.b - height * model.expansion_factor,
        coord_origin=bbox.coord_origin,
    )

    page_ix = element_prov.page_no - 1
    page_backend = backend.load_page(page_no=page_ix)
    cropped_image = page_backend.get_page_image(
        scale=model.images_scale, cropbox=expanded_bbox
    )
    return ItemAndImageEnrichmentElement(item=element, image=cropped_image)
Iterate through the document
This block defines the enrich_document() which is responsible for iterating through the document and batch the selected document items for running through the model.

def enrich_document(
    doc: DoclingDocument,
    backend: PyPdfiumDocumentBackend,
    model: BaseItemAndImageEnrichmentModel,
) -> DoclingDocument:
    def _prepare_elements(
        doc: DoclingDocument,
        backend: PyPdfiumDocumentBackend,
        model: BaseItemAndImageEnrichmentModel,
    ) -> Iterable[NodeItem]:
        for doc_element, _level in doc.iterate_items():
            prepared_element = prepare_element(
                doc=doc, backend=backend, model=model, element=doc_element
            )
            if prepared_element is not None:
                yield prepared_element

    for element_batch in chunkify(
        _prepare_elements(doc, backend, model),
        BATCH_SIZE,
    ):
        for element in model(doc=doc, element_batch=element_batch):  # Must exhaust!
            pass

    return doc
Open and process
The main() function which initializes the document and model objects for calling enrich_document().

def main():
    data_folder = Path(__file__).parent / "../../tests/data"
    input_pdf_path = data_folder / "pdf/2206.01062.pdf"

    input_doc_path = data_folder / "groundtruth/docling_v2/2206.01062.json"

    doc = DoclingDocument.load_from_json(input_doc_path)

    in_pdf_doc = InputDocument(
        input_pdf_path,
        format=InputFormat.PDF,
        backend=PyPdfiumDocumentBackend,
        filename=input_pdf_path.name,
    )
    backend = in_pdf_doc._backend

    model = DocumentPictureClassifier(
        enabled=True,
        artifacts_path=None,
        options=DocumentPictureClassifierOptions(),
        accelerator_options=AcceleratorOptions(),
    )

    doc = enrich_document(doc=doc, backend=backend, model=model)

    for pic in doc.pictures[:5]:
        print(pic.self_ref)
        pprint(pic.annotations)
if __name__ == "__main__":
    main()


## RAG with Milvus
Step	Tech	Execution
Embedding	OpenAI (text-embedding-3-small)	🌐 Remote
Vector store	Milvus	💻 Local
Gen AI	OpenAI (gpt-4o)	🌐 Remote
A recipe 🧑‍🍳 🐥 💚
This is a code recipe that uses Milvus, the world's most advanced open-source vector database, to perform RAG over documents parsed by Docling.

In this notebook, we accomplish the following:

Parse documents using Docling's document conversion capabilities
Perform hierarchical chunking of the documents using Docling
Generate text embeddings with OpenAI
Perform RAG using Milvus, the world's most advanced open-source vector database
Note: For best results, please use GPU acceleration to run this notebook. Here are two options for running this notebook:

Locally on a MacBook with an Apple Silicon chip. Converting all documents in the notebook takes ~2 minutes on a MacBook M2 due to Docling's usage of MPS accelerators.
Run this notebook on Google Colab. Converting all documents in the notebook takes ~8 minutes on a Google Colab T4 GPU.
Preparation
Dependencies and Environment
To start, install the required dependencies by running the following command:

! pip install --upgrade pymilvus docling openai torch
If you are using Google Colab, to enable dependencies just installed, you may need to restart the runtime (click on the "Runtime" menu at the top of the screen, and select "Restart session" from the dropdown menu).

GPU Checking
Part of what makes Docling so remarkable is the fact that it can run on commodity hardware. This means that this notebook can be run on a local machine with GPU acceleration. If you're using a MacBook with a silicon chip, Docling integrates seamlessly with Metal Performance Shaders (MPS). MPS provides out-of-the-box GPU acceleration for macOS, seamlessly integrating with PyTorch and TensorFlow, offering energy-efficient performance on Apple Silicon, and broad compatibility with all Metal-supported GPUs.

The code below checks to see if a GPU is available, either via CUDA or MPS.

import torch

# Check if GPU or MPS is available
if torch.cuda.is_available():
    device = torch.device("cuda")
    print(f"CUDA GPU is enabled: {torch.cuda.get_device_name(0)}")
elif torch.backends.mps.is_available():
    device = torch.device("mps")
    print("MPS GPU is enabled.")
else:
    raise OSError(
        "No GPU or MPS device found. Please check your environment and ensure GPU or MPS support is configured."
    )
MPS GPU is enabled.
Setting Up API Keys
We will use OpenAI as the LLM in this example. You should prepare the OPENAI_API_KEY as an environment variable.

import os

os.environ["OPENAI_API_KEY"] = "sk-***********"
Prepare the LLM and Embedding Model
We initialize the OpenAI client to prepare the embedding model.

from openai import OpenAI

openai_client = OpenAI()
Define a function to generate text embeddings using OpenAI client. We use the text-embedding-3-small model as an example.

def emb_text(text):
    return (
        openai_client.embeddings.create(input=text, model="text-embedding-3-small")
        .data[0]
        .embedding
    )
Generate a test embedding and print its dimension and first few elements.

test_embedding = emb_text("This is a test")
embedding_dim = len(test_embedding)
print(embedding_dim)
print(test_embedding[:10])
1536
[0.009889289736747742, -0.005578675772994757, 0.00683477520942688, -0.03805781528353691, -0.01824733428657055, -0.04121600463986397, -0.007636285852640867, 0.03225184231996536, 0.018949154764413834, 9.352207416668534e-05]
Process Data Using Docling
Docling can parse various document formats into a unified representation (Docling Document), which can then be exported to different output formats. For a full list of supported input and output formats, please refer to the official documentation.

In this tutorial, we will use a Markdown file (source) as the input. We will process the document using a HierarchicalChunker provided by Docling to generate structured, hierarchical chunks suitable for downstream RAG tasks.

from docling_core.transforms.chunker import HierarchicalChunker

from docling.document_converter import DocumentConverter

converter = DocumentConverter()
chunker = HierarchicalChunker()

# Convert the input file to Docling Document
source = "https://milvus.io/docs/overview.md"
doc = converter.convert(source).document

# Perform hierarchical chunking
texts = [chunk.text for chunk in chunker.chunk(doc)]
Load Data into Milvus
Create the collection
With data in hand, we can create a MilvusClient instance and insert the data into a Milvus collection.

from pymilvus import MilvusClient

milvus_client = MilvusClient(uri="./milvus_demo.db")
collection_name = "my_rag_collection"
As for the argument of MilvusClient:

Setting the uri as a local file, e.g../milvus.db, is the most convenient method, as it automatically utilizes Milvus Lite to store all data in this file.
If you have large scale of data, you can set up a more performant Milvus server on docker or kubernetes. In this setup, please use the server uri, e.g.http://localhost:19530, as your uri.
If you want to use Zilliz Cloud, the fully managed cloud service for Milvus, adjust the uri and token, which correspond to the Public Endpoint and Api key in Zilliz Cloud.
Check if the collection already exists and drop it if it does.

if milvus_client.has_collection(collection_name):
    milvus_client.drop_collection(collection_name)
Create a new collection with specified parameters.

If we don’t specify any field information, Milvus will automatically create a default id field for primary key, and a vector field to store the vector data. A reserved JSON field is used to store non-schema-defined fields and their values.

milvus_client.create_collection(
    collection_name=collection_name,
    dimension=embedding_dim,
    metric_type="IP",  # Inner product distance
    consistency_level="Strong",  # Supported values are (`"Strong"`, `"Session"`, `"Bounded"`, `"Eventually"`). See https://milvus.io/docs/consistency.md#Consistency-Level for more details.
)
Insert data
from tqdm import tqdm

data = []

for i, chunk in enumerate(tqdm(texts, desc="Processing chunks")):
    embedding = emb_text(chunk)
    data.append({"id": i, "vector": embedding, "text": chunk})

milvus_client.insert(collection_name=collection_name, data=data)
Processing chunks: 100%|██████████| 38/38 [00:14<00:00,  2.59it/s]
{'insert_count': 38, 'ids': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37], 'cost': 0}
Build RAG
Retrieve data for a query
Let’s specify a query question about the website we just scraped.

question = (
    "What are the three deployment modes of Milvus, and what are their differences?"
)
Search for the question in the collection and retrieve the semantic top-3 matches.

search_res = milvus_client.search(
    collection_name=collection_name,
    data=[emb_text(question)],
    limit=3,
    search_params={"metric_type": "IP", "params": {}},
    output_fields=["text"],
)
Let’s take a look at the search results of the query

import json

retrieved_lines_with_distances = [
    (res["entity"]["text"], res["distance"]) for res in search_res[0]
]
print(json.dumps(retrieved_lines_with_distances, indent=4))
[
    [
        "Milvus offers three deployment modes, covering a wide range of data scales\u2014from local prototyping in Jupyter Notebooks to massive Kubernetes clusters managing tens of billions of vectors:",
        0.6503315567970276
    ],
    [
        "Milvus Lite is a Python library that can be easily integrated into your applications. As a lightweight version of Milvus, it\u2019s ideal for quick prototyping in Jupyter Notebooks or running on edge devices with limited resources. Learn more.\nMilvus Standalone is a single-machine server deployment, with all components bundled into a single Docker image for convenient deployment. Learn more.\nMilvus Distributed can be deployed on Kubernetes clusters, featuring a cloud-native architecture designed for billion-scale or even larger scenarios. This architecture ensures redundancy in critical components. Learn more.",
        0.6281915903091431
    ],
    [
        "What is Milvus?\nUnstructured Data, Embeddings, and Milvus\nWhat Makes Milvus so Fast\uff1f\nWhat Makes Milvus so Scalable\nTypes of Searches Supported by Milvus\nComprehensive Feature Set",
        0.6117826700210571
    ]
]
Use LLM to get a RAG response
Convert the retrieved documents into a string format.

context = "\n".join(
    [line_with_distance[0] for line_with_distance in retrieved_lines_with_distances]
)
Define system and user prompts for the Lanage Model. This prompt is assembled with the retrieved documents from Milvus.

SYSTEM_PROMPT = """
Human: You are an AI assistant. You are able to find answers to the questions from the contextual passage snippets provided.
"""
USER_PROMPT = f"""
Use the following pieces of information enclosed in <context> tags to provide an answer to the question enclosed in <question> tags.
<context>
{context}
</context>
<question>
{question}
</question>
"""
Use OpenAI ChatGPT to generate a response based on the prompts.

response = openai_client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": USER_PROMPT},
    ],
)
print(response.choices[0].message.content)
The three deployment modes of Milvus are:

1. **Milvus Lite**: This is a Python library that integrates easily into your applications. It's a lightweight version ideal for quick prototyping in Jupyter Notebooks or for running on edge devices with limited resources.

2. **Milvus Standalone**: This mode is a single-machine server deployment where all components are bundled into a single Docker image, making it convenient to deploy.

3. **Milvus Distributed**: This mode is designed for deployment on Kubernetes clusters. It features a cloud-native architecture suited for managing scenarios at a billion-scale or larger, ensuring redundancy in critical components.


## RAG with Weaviate
Step	Tech	Execution
Embedding	Open AI	🌐 Remote
Vector store	Weavieate	💻 Local
Gen AI	Open AI	🌐 Remote
A recipe 🧑‍🍳 🐥 💚
This is a code recipe that uses Weaviate to perform RAG over PDF documents parsed by Docling.

In this notebook, we accomplish the following:

Parse the top machine learning papers on arXiv using Docling
Perform hierarchical chunking of the documents using Docling
Generate text embeddings with OpenAI
Perform RAG using Weaviate
To run this notebook, you'll need:

An OpenAI API key
Access to GPU/s
Note: For best results, please use GPU acceleration to run this notebook. Here are two options for running this notebook:

Locally on a MacBook with an Apple Silicon chip. Converting all documents in the notebook takes ~2 minutes on a MacBook M2 due to Docling's usage of MPS accelerators.
Run this notebook on Google Colab. Converting all documents in the notebook takes ~8 minutes on a Google Colab T4 GPU.
Install Docling and Weaviate client
Note: If Colab prompts you to restart the session after running the cell below, click "restart" and proceed with running the rest of the notebook.

%%capture
%pip install docling~="2.7.0"
%pip install -U weaviate-client~="4.9.4"
%pip install rich
%pip install torch

import logging
import warnings

warnings.filterwarnings("ignore")

# Suppress Weaviate client logs
logging.getLogger("weaviate").setLevel(logging.ERROR)
🐥 Part 1: Docling
Part of what makes Docling so remarkable is the fact that it can run on commodity hardware. This means that this notebook can be run on a local machine with GPU acceleration. If you're using a MacBook with a silicon chip, Docling integrates seamlessly with Metal Performance Shaders (MPS). MPS provides out-of-the-box GPU acceleration for macOS, seamlessly integrating with PyTorch and TensorFlow, offering energy-efficient performance on Apple Silicon, and broad compatibility with all Metal-supported GPUs.

The code below checks to see if a GPU is available, either via CUDA or MPS.

import torch

# Check if GPU or MPS is available
if torch.cuda.is_available():
    device = torch.device("cuda")
    print(f"CUDA GPU is enabled: {torch.cuda.get_device_name(0)}")
elif torch.backends.mps.is_available():
    device = torch.device("mps")
    print("MPS GPU is enabled.")
else:
    raise OSError(
        "No GPU or MPS device found. Please check your environment and ensure GPU or MPS support is configured."
    )
MPS GPU is enabled.
Here, we've collected 10 influential machine learning papers published as PDFs on arXiv. Because Docling does not yet have title extraction for PDFs, we manually add the titles in a corresponding list.

Note: Converting all 10 papers should take around 8 minutes with a T4 GPU.

# Influential machine learning papers
source_urls = [
    "https://arxiv.org/pdf/1706.03762",
    "https://arxiv.org/pdf/1810.04805",
    "https://arxiv.org/pdf/1406.2661",
    "https://arxiv.org/pdf/1409.0473",
    "https://arxiv.org/pdf/1412.6980",
    "https://arxiv.org/pdf/1312.6114",
    "https://arxiv.org/pdf/1312.5602",
    "https://arxiv.org/pdf/1512.03385",
    "https://arxiv.org/pdf/1409.3215",
    "https://arxiv.org/pdf/1301.3781",
]

# And their corresponding titles (because Docling doesn't have title extraction yet!)
source_titles = [
    "Attention Is All You Need",
    "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    "Generative Adversarial Nets",
    "Neural Machine Translation by Jointly Learning to Align and Translate",
    "Adam: A Method for Stochastic Optimization",
    "Auto-Encoding Variational Bayes",
    "Playing Atari with Deep Reinforcement Learning",
    "Deep Residual Learning for Image Recognition",
    "Sequence to Sequence Learning with Neural Networks",
    "A Neural Probabilistic Language Model",
]
Convert PDFs to Docling documents
Here we use Docling's .convert_all() to parse a batch of PDFs. The result is a list of Docling documents that we can use for text extraction.

Note: Please ignore the ERR# message.

from docling.document_converter import DocumentConverter

# Instantiate the doc converter
doc_converter = DocumentConverter()

# Directly pass list of files or streams to `convert_all`
conv_results_iter = doc_converter.convert_all(source_urls)  # previously `convert`

# Iterate over the generator to get a list of Docling documents
docs = [result.document for result in conv_results_iter]
Fetching 9 files: 100%|██████████| 9/9 [00:00<00:00, 84072.91it/s]
ERR#: COULD NOT CONVERT TO RS THIS TABLE TO COMPUTE SPANS
Post-process extracted document data
Perform hierarchical chunking on documents
We use Docling's HierarchicalChunker() to perform hierarchy-aware chunking of our list of documents. This is meant to preserve some of the structure and relationships within the document, which enables more accurate and relevant retrieval in our RAG pipeline.

from docling_core.transforms.chunker import HierarchicalChunker

# Initialize lists for text, and titles
texts, titles = [], []

chunker = HierarchicalChunker()

# Process each document in the list
for doc, title in zip(docs, source_titles):  # Pair each document with its title
    chunks = list(
        chunker.chunk(doc)
    )  # Perform hierarchical chunking and get text from chunks
    for chunk in chunks:
        texts.append(chunk.text)
        titles.append(title)
Because we're splitting the documents into chunks, we'll concatenate the article title to the beginning of each chunk for additional context.

# Concatenate title and text
for i in range(len(texts)):
    texts[i] = f"{titles[i]} {texts[i]}"
💚 Part 2: Weaviate
Create and configure an embedded Weaviate collection
We'll be using the OpenAI API for both generating the text embeddings and for the generative model in our RAG pipeline. The code below dynamically fetches your API key based on whether you're running this notebook in Google Colab and running it as a regular Jupyter notebook. All you need to do is replace openai_api_key_var with the name of your environmental variable name or Colab secret name for the API key.

If you're running this notebook in Google Colab, make sure you add your API key as a secret.

# OpenAI API key variable name
openai_api_key_var = "OPENAI_API_KEY"  # Replace with the name of your secret/env var

# Fetch OpenAI API key
try:
    # If running in Colab, fetch API key from Secrets
    import google.colab
    from google.colab import userdata

    openai_api_key = userdata.get(openai_api_key_var)
    if not openai_api_key:
        raise ValueError(f"Secret '{openai_api_key_var}' not found in Colab secrets.")
except ImportError:
    # If not running in Colab, fetch API key from environment variable
    import os

    openai_api_key = os.getenv(openai_api_key_var)
    if not openai_api_key:
        raise OSError(
            f"Environment variable '{openai_api_key_var}' is not set. "
            "Please define it before running this script."
        )
Embedded Weaviate allows you to spin up a Weaviate instance directly from your application code, without having to use a Docker container. If you're interested in other deployment methods, like using Docker-Compose or Kubernetes, check out this page in the Weaviate docs.

import weaviate

# Connect to Weaviate embedded
client = weaviate.connect_to_embedded(headers={"X-OpenAI-Api-Key": openai_api_key})
import weaviate.classes.config as wc

# Define the collection name
collection_name = "docling"

# Delete the collection if it already exists
if client.collections.exists(collection_name):
    client.collections.delete(collection_name)

# Create the collection
collection = client.collections.create(
    name=collection_name,
    vectorizer_config=wc.Configure.Vectorizer.text2vec_openai(
        model="text-embedding-3-large",  # Specify your embedding model here
    ),
    # Enable generative model from Cohere
    generative_config=wc.Configure.Generative.openai(
        model="gpt-4o"  # Specify your generative model for RAG here
    ),
    # Define properties of metadata
    properties=[
        wc.Property(name="text", data_type=wc.DataType.TEXT),
        wc.Property(name="title", data_type=wc.DataType.TEXT, skip_vectorization=True),
    ],
)
Wrangle data into an acceptable format for Weaviate
Transform our data from lists to a list of dictionaries for insertion into our Weaviate collection.

# Initialize the data object
data = []

# Create a dictionary for each row by iterating through the corresponding lists
for text, title in zip(texts, titles):
    data_point = {
        "text": text,
        "title": title,
    }
    data.append(data_point)
Insert data into Weaviate and generate embeddings
Embeddings will be generated upon insertion to our Weaviate collection.

# Insert text chunks and metadata into vector DB collection
response = collection.data.insert_many(data)

if response.has_errors:
    print(response.errors)
else:
    print("Insert complete.")
Query the data
Here, we perform a simple similarity search to return the most similar embedded chunks to our search query.

from weaviate.classes.query import MetadataQuery

response = collection.query.near_text(
    query="bert",
    limit=2,
    return_metadata=MetadataQuery(distance=True),
    return_properties=["text", "title"],
)

for o in response.objects:
    print(o.properties)
    print(o.metadata.distance)
{'text': 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding A distinctive feature of BERT is its unified architecture across different tasks. There is mini-', 'title': 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'}
0.6578550338745117
{'text': 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding We introduce a new language representation model called BERT , which stands for B idirectional E ncoder R epresentations from T ransformers. Unlike recent language representation models (Peters et al., 2018a; Radford et al., 2018), BERT is designed to pretrain deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers. As a result, the pre-trained BERT model can be finetuned with just one additional output layer to create state-of-the-art models for a wide range of tasks, such as question answering and language inference, without substantial taskspecific architecture modifications.', 'title': 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'}
0.6696287989616394
Perform RAG on parsed articles
Weaviate's generate module allows you to perform RAG over your embedded data without having to use a separate framework.

We specify a prompt that includes the field we want to search through in the database (in this case it's text), a query that includes our search term, and the number of retrieved results to use in the generation.

from rich.console import Console
from rich.panel import Panel

# Create a prompt where context from the Weaviate collection will be injected
prompt = "Explain how {text} works, using only the retrieved context."
query = "bert"

response = collection.generate.near_text(
    query=query, limit=3, grouped_task=prompt, return_properties=["text", "title"]
)

# Prettify the output using Rich
console = Console()

console.print(
    Panel(f"{prompt}".replace("{text}", query), title="Prompt", border_style="bold red")
)
console.print(
    Panel(response.generated, title="Generated Content", border_style="bold green")
)
╭──────────────────────────────────────────────────── Prompt ─────────────────────────────────────────────────────╮
│ Explain how bert works, using only the retrieved context.                                                       │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭─────────────────────────────────────────────── Generated Content ───────────────────────────────────────────────╮
│ BERT, which stands for Bidirectional Encoder Representations from Transformers, is a language representation    │
│ model designed to pretrain deep bidirectional representations from unlabeled text. It conditions on both left   │
│ and right context in all layers, unlike traditional left-to-right or right-to-left language models. This        │
│ pre-training involves two unsupervised tasks. The pre-trained BERT model can then be fine-tuned with just one   │
│ additional output layer to create state-of-the-art models for various tasks, such as question answering and     │
│ language inference, without needing substantial task-specific architecture modifications. A distinctive feature │
│ of BERT is its unified architecture across different tasks.                                                     │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
# Create a prompt where context from the Weaviate collection will be injected
prompt = "Explain how {text} works, using only the retrieved context."
query = "a generative adversarial net"

response = collection.generate.near_text(
    query=query, limit=3, grouped_task=prompt, return_properties=["text", "title"]
)

# Prettify the output using Rich
console = Console()

console.print(
    Panel(f"{prompt}".replace("{text}", query), title="Prompt", border_style="bold red")
)
console.print(
    Panel(response.generated, title="Generated Content", border_style="bold green")
)
╭──────────────────────────────────────────────────── Prompt ─────────────────────────────────────────────────────╮
│ Explain how a generative adversarial net works, using only the retrieved context.                               │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭─────────────────────────────────────────────── Generated Content ───────────────────────────────────────────────╮
│ Generative Adversarial Nets (GANs) operate within an adversarial framework where two models are trained         │
│ simultaneously: a generative model (G) and a discriminative model (D). The generative model aims to capture the │
│ data distribution and generate samples that mimic real data, while the discriminative model's task is to        │
│ distinguish between samples from the real data and those generated by G. This setup is akin to a game where the │
│ generative model acts like counterfeiters trying to produce indistinguishable fake currency, and the            │
│ discriminative model acts like the police trying to detect these counterfeits.                                  │
│                                                                                                                 │
│ The training process involves a minimax two-player game where G tries to maximize the probability of D making a │
│ mistake, while D tries to minimize it. When both models are defined by multilayer perceptrons, they can be      │
│ trained using backpropagation without the need for Markov chains or approximate inference networks. The         │
│ ultimate goal is for G to perfectly replicate the training data distribution, making D's output equal to 1/2    │
│ everywhere, indicating it cannot distinguish between real and generated data. This framework allows for         │
│ specific training algorithms and optimization techniques, such as backpropagation and dropout, to be            │
│ effectively utilized.                                                                                           │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
We can see that our RAG pipeline performs relatively well for simple queries, especially given the small size of the dataset. Scaling this method for converting a larger sample of PDFs would require more compute (GPUs) and a more advanced deployment of Weaviate (like Docker, Kubernetes, or Weaviate Cloud). For more information on available Weaviate configurations, check out the documentation.



## RAG with Azure AI Search
Step	Tech	Execution
Embedding	Azure OpenAI	🌐 Remote
Vector Store	Azure AI Search	🌐 Remote
Gen AI	Azure OpenAI	🌐 Remote
A recipe 🧑‍🍳 🐥 💚
This notebook demonstrates how to build a Retrieval-Augmented Generation (RAG) system using:

Docling for document parsing and chunking
Azure AI Search for vector indexing and retrieval
Azure OpenAI for embeddings and chat completion
This sample demonstrates how to:

Parse a PDF with Docling.
Chunk the parsed text.
Use Azure OpenAI for embeddings.
Index and search in Azure AI Search.
Run a retrieval-augmented generation (RAG) query with Azure OpenAI GPT-4o.
# If running in a fresh environment (like Google Colab), uncomment and run this single command:
%pip install "docling~=2.12" azure-search-documents==11.5.2 azure-identity openai rich torch python-dotenv
Part 0: Prerequisites
Azure AI Search resource

Azure OpenAI resource with a deployed embedding and chat completion model (e.g. text-embedding-3-small and gpt-4o)

Docling 2.12+ (installs docling_core automatically) Docling installed (Python 3.8+ environment)

A GPU-enabled environment is preferred for faster parsing. Docling 2.12 automatically detects GPU if present.

If you only have CPU, parsing large PDFs can be slower.
import os

from dotenv import load_dotenv

load_dotenv()


def _get_env(key, default=None):
    try:
        from google.colab import userdata

        try:
            return userdata.get(key)
        except userdata.SecretNotFoundError:
            pass
    except ImportError:
        pass
    return os.getenv(key, default)


AZURE_SEARCH_ENDPOINT = _get_env("AZURE_SEARCH_ENDPOINT")
AZURE_SEARCH_KEY = _get_env("AZURE_SEARCH_KEY")  # Ensure this is your Admin Key
AZURE_SEARCH_INDEX_NAME = _get_env("AZURE_SEARCH_INDEX_NAME", "docling-rag-sample")
AZURE_OPENAI_ENDPOINT = _get_env("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = _get_env("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_API_VERSION = _get_env("AZURE_OPENAI_API_VERSION", "2024-10-21")
AZURE_OPENAI_CHAT_MODEL = _get_env(
    "AZURE_OPENAI_CHAT_MODEL"
)  # Using a deployed model named "gpt-4o"
AZURE_OPENAI_EMBEDDINGS = _get_env(
    "AZURE_OPENAI_EMBEDDINGS", "text-embedding-3-small"
)  # Using a deployed model named "text-embeddings-3-small"
Part 1: Parse the PDF with Docling
We’ll parse the Microsoft GraphRAG Research Paper (~15 pages). Parsing should be relatively quick, even on CPU, but it will be faster on a GPU or MPS device if available.

(If you prefer a different document, simply provide a different URL or local file path.)

from rich.console import Console
from rich.panel import Panel

from docling.document_converter import DocumentConverter

console = Console()

# This URL points to the Microsoft GraphRAG Research Paper (arXiv: 2404.16130), ~15 pages
source_url = "https://arxiv.org/pdf/2404.16130"

console.print(
    "[bold yellow]Parsing a ~15-page PDF. The process should be relatively quick, even on CPU...[/bold yellow]"
)
converter = DocumentConverter()
result = converter.convert(source_url)

# Optional: preview the parsed Markdown
md_preview = result.document.export_to_markdown()
console.print(Panel(md_preview[:500] + "...", title="Docling Markdown Preview"))
Parsing a ~15-page PDF. The process should be relatively quick, even on CPU...
╭─────────────────────────────────────────── Docling Markdown Preview ────────────────────────────────────────────╮
│ ## From Local to Global: A Graph RAG Approach to Query-Focused Summarization                                    │
│                                                                                                                 │
│ Darren Edge 1†                                                                                                  │
│                                                                                                                 │
│ Ha Trinh 1†                                                                                                     │
│                                                                                                                 │
│ Newman Cheng 2                                                                                                  │
│                                                                                                                 │
│ Joshua Bradley 2                                                                                                │
│                                                                                                                 │
│ Alex Chao 3                                                                                                     │
│                                                                                                                 │
│ Apurva Mody 3                                                                                                   │
│                                                                                                                 │
│ Steven Truitt 2                                                                                                 │
│                                                                                                                 │
│ ## Jonathan Larson 1                                                                                            │
│                                                                                                                 │
│ 1 Microsoft Research 2 Microsoft Strategic Missions and Technologies 3 Microsoft Office of the CTO              │
│                                                                                                                 │
│ { daedge,trinhha,newmancheng,joshbradley,achao,moapurva,steventruitt,jolarso } @microsoft.com                   │
│                                                                                                                 │
│ † These authors contributed equally to this work                                                                │
│                                                                                                                 │
│ ## Abstract                                                                                                     │
│                                                                                                                 │
│ The use of retrieval-augmented gen...                                                                           │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Part 2: Hierarchical Chunking
We convert the Document into smaller chunks for embedding and indexing. The built-in HierarchicalChunker preserves structure.

from docling.chunking import HierarchicalChunker

chunker = HierarchicalChunker()
doc_chunks = list(chunker.chunk(result.document))

all_chunks = []
for idx, c in enumerate(doc_chunks):
    chunk_text = c.text
    all_chunks.append((f"chunk_{idx}", chunk_text))

console.print(f"Total chunks from PDF: {len(all_chunks)}")
Total chunks from PDF: 106
Part 3: Create Azure AI Search Index and Push Chunk Embeddings
We’ll define a vector index in Azure AI Search, then embed each chunk using Azure OpenAI and upload in batches.

from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    AzureOpenAIVectorizer,
    AzureOpenAIVectorizerParameters,
    HnswAlgorithmConfiguration,
    SearchableField,
    SearchField,
    SearchFieldDataType,
    SearchIndex,
    SimpleField,
    VectorSearch,
    VectorSearchProfile,
)
from rich.console import Console

console = Console()

VECTOR_DIM = 1536  # Adjust based on your chosen embeddings model

index_client = SearchIndexClient(
    AZURE_SEARCH_ENDPOINT, AzureKeyCredential(AZURE_SEARCH_KEY)
)


def create_search_index(index_name: str):
    # Define fields
    fields = [
        SimpleField(name="chunk_id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="content", type=SearchFieldDataType.String),
        SearchField(
            name="content_vector",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            searchable=True,
            filterable=False,
            sortable=False,
            facetable=False,
            vector_search_dimensions=VECTOR_DIM,
            vector_search_profile_name="default",
        ),
    ]
    # Vector search config with an AzureOpenAIVectorizer
    vector_search = VectorSearch(
        algorithms=[HnswAlgorithmConfiguration(name="default")],
        profiles=[
            VectorSearchProfile(
                name="default",
                algorithm_configuration_name="default",
                vectorizer_name="default",
            )
        ],
        vectorizers=[
            AzureOpenAIVectorizer(
                vectorizer_name="default",
                parameters=AzureOpenAIVectorizerParameters(
                    resource_url=AZURE_OPENAI_ENDPOINT,
                    deployment_name=AZURE_OPENAI_EMBEDDINGS,
                    model_name="text-embedding-3-small",
                    api_key=AZURE_OPENAI_API_KEY,
                ),
            )
        ],
    )

    # Create or update the index
    new_index = SearchIndex(name=index_name, fields=fields, vector_search=vector_search)
    try:
        index_client.delete_index(index_name)
    except Exception:
        pass

    index_client.create_or_update_index(new_index)
    console.print(f"Index '{index_name}' created.")


create_search_index(AZURE_SEARCH_INDEX_NAME)
Index 'docling-rag-sample-2' created.
Generate Embeddings and Upload to Azure AI Search
from azure.search.documents import SearchClient
from openai import AzureOpenAI

search_client = SearchClient(
    AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_INDEX_NAME, AzureKeyCredential(AZURE_SEARCH_KEY)
)
openai_client = AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    api_version=AZURE_OPENAI_API_VERSION,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
)


def embed_text(text: str):
    """
    Helper to generate embeddings with Azure OpenAI.
    """
    response = openai_client.embeddings.create(
        input=text, model=AZURE_OPENAI_EMBEDDINGS
    )
    return response.data[0].embedding


upload_docs = []
for chunk_id, chunk_text in all_chunks:
    embedding_vector = embed_text(chunk_text)
    upload_docs.append(
        {
            "chunk_id": chunk_id,
            "content": chunk_text,
            "content_vector": embedding_vector,
        }
    )


BATCH_SIZE = 50
for i in range(0, len(upload_docs), BATCH_SIZE):
    subset = upload_docs[i : i + BATCH_SIZE]
    resp = search_client.upload_documents(documents=subset)

    all_succeeded = all(r.succeeded for r in resp)
    console.print(
        f"Uploaded batch {i} -> {i + len(subset)}; all_succeeded: {all_succeeded}, "
        f"first_doc_status_code: {resp[0].status_code}"
    )

console.print("All chunks uploaded to Azure Search.")
Uploaded batch 0 -> 50; all_succeeded: True, first_doc_status_code: 201
Uploaded batch 50 -> 100; all_succeeded: True, first_doc_status_code: 201
Uploaded batch 100 -> 106; all_succeeded: True, first_doc_status_code: 201
All chunks uploaded to Azure Search.
Part 4: Perform RAG over PDF
Combine retrieval from Azure AI Search with Azure OpenAI Chat Completions (aka. grounding your LLM)

from typing import Optional

from azure.search.documents.models import VectorizableTextQuery


def generate_chat_response(prompt: str, system_message: Optional[str] = None):
    """
    Generates a single-turn chat response using Azure OpenAI Chat.
    If you need multi-turn conversation or follow-up queries, you'll have to
    maintain the messages list externally.
    """
    messages = []
    if system_message:
        messages.append({"role": "system", "content": system_message})
    messages.append({"role": "user", "content": prompt})

    completion = openai_client.chat.completions.create(
        model=AZURE_OPENAI_CHAT_MODEL, messages=messages, temperature=0.7
    )
    return completion.choices[0].message.content


user_query = "What are the main advantages of using the Graph RAG approach for query-focused summarization compared to traditional RAG methods?"
user_embed = embed_text(user_query)

vector_query = VectorizableTextQuery(
    text=user_query,  # passing in text for a hybrid search
    k_nearest_neighbors=5,
    fields="content_vector",
)

search_results = search_client.search(
    search_text=user_query, vector_queries=[vector_query], select=["content"], top=10
)

retrieved_chunks = []
for result in search_results:
    snippet = result["content"]
    retrieved_chunks.append(snippet)

context_str = "\n---\n".join(retrieved_chunks)
rag_prompt = f"""
You are an AI assistant helping answering questions about Microsoft GraphRAG.
Use ONLY the text below to answer the user's question.
If the answer isn't in the text, say you don't know.

Context:
{context_str}

Question: {user_query}
Answer:
"""

final_answer = generate_chat_response(rag_prompt)

console.print(Panel(rag_prompt, title="RAG Prompt", style="bold red"))
console.print(Panel(final_answer, title="RAG Response", style="bold green"))
╭────────────────────────────────────────────────── RAG Prompt ───────────────────────────────────────────────────╮
│                                                                                                                 │
│ You are an AI assistant helping answering questions about Microsoft GraphRAG.                                   │
│ Use ONLY the text below to answer the user's question.                                                          │
│ If the answer isn't in the text, say you don't know.                                                            │
│                                                                                                                 │
│ Context:                                                                                                        │
│ Community summaries vs. source texts. When comparing community summaries to source texts using Graph RAG,       │
│ community summaries generally provided a small but consistent improvement in answer comprehensiveness and       │
│ diversity, except for root-level summaries. Intermediate-level summaries in the Podcast dataset and low-level   │
│ community summaries in the News dataset achieved comprehensiveness win rates of 57% and 64%, respectively.      │
│ Diversity win rates were 57% for Podcast intermediate-level summaries and 60% for News low-level community      │
│ summaries. Table 3 also illustrates the scalability advantages of Graph RAG compared to source text             │
│ summarization: for low-level community summaries ( C3 ), Graph RAG required 26-33% fewer context tokens, while  │
│ for root-level community summaries ( C0 ), it required over 97% fewer tokens. For a modest drop in performance  │
│ compared with other global methods, root-level Graph RAG offers a highly efficient method for the iterative     │
│ question answering that characterizes sensemaking activity, while retaining advantages in comprehensiveness     │
│ (72% win rate) and diversity (62% win rate) over na¨ıve RAG.                                                    │
│ ---                                                                                                             │
│ We have presented a global approach to Graph RAG, combining knowledge graph generation, retrieval-augmented     │
│ generation (RAG), and query-focused summarization (QFS) to support human sensemaking over entire text corpora.  │
│ Initial evaluations show substantial improvements over a na¨ıve RAG baseline for both the comprehensiveness and │
│ diversity of answers, as well as favorable comparisons to a global but graph-free approach using map-reduce     │
│ source text summarization. For situations requiring many global queries over the same dataset, summaries of     │
│ root-level communities in the entity-based graph index provide a data index that is both superior to na¨ıve RAG │
│ and achieves competitive performance to other global methods at a fraction of the token cost.                   │
│ ---                                                                                                             │
│ Trade-offs of building a graph index . We consistently observed Graph RAG achieve the best headto-head results  │
│ against other methods, but in many cases the graph-free approach to global summarization of source texts        │
│ performed competitively. The real-world decision about whether to invest in building a graph index depends on   │
│ multiple factors, including the compute budget, expected number of lifetime queries per dataset, and value      │
│ obtained from other aspects of the graph index (including the generic community summaries and the use of other  │
│ graph-related RAG approaches).                                                                                  │
│ ---                                                                                                             │
│ Future work . The graph index, rich text annotations, and hierarchical community structure supporting the       │
│ current Graph RAG approach offer many possibilities for refinement and adaptation. This includes RAG approaches │
│ that operate in a more local manner, via embedding-based matching of user queries and graph annotations, as     │
│ well as the possibility of hybrid RAG schemes that combine embedding-based matching against community reports   │
│ before employing our map-reduce summarization mechanisms. This 'roll-up' operation could also be extended       │
│ across more levels of the community hierarchy, as well as implemented as a more exploratory 'drill down'        │
│ mechanism that follows the information scent contained in higher-level community summaries.                     │
│ ---                                                                                                             │
│ Advanced RAG systems include pre-retrieval, retrieval, post-retrieval strategies designed to overcome the       │
│ drawbacks of Na¨ıve RAG, while Modular RAG systems include patterns for iterative and dynamic cycles of         │
│ interleaved retrieval and generation (Gao et al., 2023). Our implementation of Graph RAG incorporates multiple  │
│ concepts related to other systems. For example, our community summaries are a kind of self-memory (Selfmem,     │
│ Cheng et al., 2024) for generation-augmented retrieval (GAR, Mao et al., 2020) that facilitates future          │
│ generation cycles, while our parallel generation of community answers from these summaries is a kind of         │
│ iterative (Iter-RetGen, Shao et al., 2023) or federated (FeB4RAG, Wang et al., 2024) retrieval-generation       │
│ strategy. Other systems have also combined these concepts for multi-document summarization (CAiRE-COVID, Su et  │
│ al., 2020) and multi-hop question answering (ITRG, Feng et al., 2023; IR-CoT, Trivedi et al., 2022; DSP,        │
│ Khattab et al., 2022). Our use of a hierarchical index and summarization also bears resemblance to further      │
│ approaches, such as generating a hierarchical index of text chunks by clustering the vectors of text embeddings │
│ (RAPTOR, Sarthi et al., 2024) or generating a 'tree of clarifications' to answer multiple interpretations of    │
│ ambiguous questions (Kim et al., 2023). However, none of these iterative or hierarchical approaches use the     │
│ kind of self-generated graph index that enables Graph RAG.                                                      │
│ ---                                                                                                             │
│ The use of retrieval-augmented generation (RAG) to retrieve relevant information from an external knowledge     │
│ source enables large language models (LLMs) to answer questions over private and/or previously unseen document  │
│ collections. However, RAG fails on global questions directed at an entire text corpus, such as 'What are the    │
│ main themes in the dataset?', since this is inherently a queryfocused summarization (QFS) task, rather than an  │
│ explicit retrieval task. Prior QFS methods, meanwhile, fail to scale to the quantities of text indexed by       │
│ typical RAGsystems. To combine the strengths of these contrasting methods, we propose a Graph RAG approach to   │
│ question answering over private text corpora that scales with both the generality of user questions and the     │
│ quantity of source text to be indexed. Our approach uses an LLM to build a graph-based text index in two        │
│ stages: first to derive an entity knowledge graph from the source documents, then to pregenerate community      │
│ summaries for all groups of closely-related entities. Given a question, each community summary is used to       │
│ generate a partial response, before all partial responses are again summarized in a final response to the user. │
│ For a class of global sensemaking questions over datasets in the 1 million token range, we show that Graph RAG  │
│ leads to substantial improvements over a na¨ıve RAG baseline for both the comprehensiveness and diversity of    │
│ generated answers. An open-source, Python-based implementation of both global and local Graph RAG approaches is │
│ forthcoming at https://aka . ms/graphrag .                                                                      │
│ ---                                                                                                             │
│ Given the multi-stage nature of our Graph RAG mechanism, the multiple conditions we wanted to compare, and the  │
│ lack of gold standard answers to our activity-based sensemaking questions, we decided to adopt a head-to-head   │
│ comparison approach using an LLM evaluator. We selected three target metrics capturing qualities that are       │
│ desirable for sensemaking activities, as well as a control metric (directness) used as a indicator of validity. │
│ Since directness is effectively in opposition to comprehensiveness and diversity, we would not expect any       │
│ method to win across all four metrics.                                                                          │
│ ---                                                                                                             │
│ Figure 1: Graph RAG pipeline using an LLM-derived graph index of source document text. This index spans nodes   │
│ (e.g., entities), edges (e.g., relationships), and covariates (e.g., claims) that have been detected,           │
│ extracted, and summarized by LLM prompts tailored to the domain of the dataset. Community detection (e.g.,      │
│ Leiden, Traag et al., 2019) is used to partition the graph index into groups of elements (nodes, edges,         │
│ covariates) that the LLM can summarize in parallel at both indexing time and query time. The 'global answer' to │
│ a given query is produced using a final round of query-focused summarization over all community summaries       │
│ reporting relevance to that query.                                                                              │
│ ---                                                                                                             │
│ Retrieval-augmented generation (RAG, Lewis et al., 2020) is an established approach to answering user questions │
│ over entire datasets, but it is designed for situations where these answers are contained locally within        │
│ regions of text whose retrieval provides sufficient grounding for the generation task. Instead, a more          │
│ appropriate task framing is query-focused summarization (QFS, Dang, 2006), and in particular, query-focused     │
│ abstractive summarization that generates natural language summaries and not just concatenated excerpts (Baumel  │
│ et al., 2018; Laskar et al., 2020; Yao et al., 2017) . In recent years, however, such distinctions between      │
│ summarization tasks that are abstractive versus extractive, generic versus query-focused, and single-document   │
│ versus multi-document, have become less relevant. While early applications of the transformer architecture      │
│ showed substantial improvements on the state-of-the-art for all such summarization tasks (Goodwin et al., 2020; │
│ Laskar et al., 2022; Liu and Lapata, 2019), these tasks are now trivialized by modern LLMs, including the GPT   │
│ (Achiam et al., 2023; Brown et al., 2020), Llama (Touvron et al., 2023), and Gemini (Anil et al., 2023) series, │
│ all of which can use in-context learning to summarize any content provided in their context window.             │
│ ---                                                                                                             │
│ community descriptions provide complete coverage of the underlying graph index and the input documents it       │
│ represents. Query-focused summarization of an entire corpus is then made possible using a map-reduce approach:  │
│ first using each community summary to answer the query independently and in parallel, then summarizing all      │
│ relevant partial answers into a final global answer.                                                            │
│                                                                                                                 │
│ Question: What are the main advantages of using the Graph RAG approach for query-focused summarization compared │
│ to traditional RAG methods?                                                                                     │
│ Answer:                                                                                                         │
│                                                                                                                 │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭───────────────────────────────────────────────── RAG Response ──────────────────────────────────────────────────╮
│ The main advantages of using the Graph RAG approach for query-focused summarization compared to traditional RAG │
│ methods include:                                                                                                │
│                                                                                                                 │
│ 1. **Improved Comprehensiveness and Diversity**: Graph RAG shows substantial improvements over a naïve RAG      │
│ baseline in terms of the comprehensiveness and diversity of answers. This is particularly beneficial for global │
│ sensemaking questions over large datasets.                                                                      │
│                                                                                                                 │
│ 2. **Scalability**: Graph RAG provides scalability advantages, achieving efficient summarization with           │
│ significantly fewer context tokens required. For instance, it requires 26-33% fewer tokens for low-level        │
│ community summaries and over 97% fewer tokens for root-level summaries compared to source text summarization.   │
│                                                                                                                 │
│ 3. **Efficiency in Iterative Question Answering**: Root-level Graph RAG offers a highly efficient method for    │
│ iterative question answering, which is crucial for sensemaking activities, with only a modest drop in           │
│ performance compared to other global methods.                                                                   │
│                                                                                                                 │
│ 4. **Global Query Handling**: It supports handling global queries effectively, as it combines knowledge graph   │
│ generation, retrieval-augmented generation, and query-focused summarization, making it suitable for sensemaking │
│ over entire text corpora.                                                                                       │
│                                                                                                                 │
│ 5. **Hierarchical Indexing and Summarization**: The use of a hierarchical index and summarization allows for    │
│ efficient processing and summarizing of community summaries into a final global answer, facilitating a          │
│ comprehensive coverage of the underlying graph index and input documents.                                       │
│                                                                                                                 │
│ 6. **Reduced Token Cost**: For situations requiring many global queries over the same dataset, Graph RAG        │
│ achieves competitive performance to other global methods at a fraction of the token cost.                       │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯


## Retrieval with Qdrant
Step	Tech	Execution
Embedding	FastEmbed	💻 Local
Vector store	Qdrant	💻 Local
Overview
This example demonstrates using Docling with Qdrant to perform a hybrid search across your documents using dense and sparse vectors.

We'll chunk the documents using Docling before adding them to a Qdrant collection. By limiting the length of the chunks, we can preserve the meaning in each vector embedding.

Setup
👉 Qdrant client uses FastEmbed to generate vector embeddings. You can install the fastembed-gpu package if you've got the hardware to support it.
%pip install --no-warn-conflicts -q qdrant-client docling fastembed
Note: you may need to restart the kernel to use updated packages.
Let's import all the classes we'll be working with.

from qdrant_client import QdrantClient

from docling.chunking import HybridChunker
from docling.datamodel.base_models import InputFormat
from docling.document_converter import DocumentConverter
For Docling, we'll set the allowed formats to HTML since we'll only be working with webpages in this tutorial.
If we set a sparse model, Qdrant client will fuse the dense and sparse results using RRF. Reference.
COLLECTION_NAME = "docling"

doc_converter = DocumentConverter(allowed_formats=[InputFormat.HTML])
client = QdrantClient(location=":memory:")
# The :memory: mode is a Python imitation of Qdrant's APIs for prototyping and CI.
# For production deployments, use the Docker image: docker run -p 6333:6333 qdrant/qdrant
# client = QdrantClient(location="http://localhost:6333")

client.set_model("sentence-transformers/all-MiniLM-L6-v2")
client.set_sparse_model("Qdrant/bm25")
/Users/pva/work/github.com/docling-project/docling/.venv/lib/python3.12/site-packages/huggingface_hub/utils/tqdm.py:155: UserWarning: Cannot enable progress bars: environment variable `HF_HUB_DISABLE_PROGRESS_BARS=1` is set and has priority.
  warnings.warn(
We can now download and chunk the document using Docling. For demonstration, we'll use an article about chunking strategies :)

result = doc_converter.convert(
    "https://www.sagacify.com/news/a-guide-to-chunking-strategies-for-retrieval-augmented-generation-rag"
)
documents, metadatas = [], []
for chunk in HybridChunker().chunk(result.document):
    documents.append(chunk.text)
    metadatas.append(chunk.meta.export_json_dict())
Let's now upload the documents to Qdrant.

The add() method batches the documents and uses FastEmbed to generate vector embeddings on our machine.
_ = client.add(
    collection_name=COLLECTION_NAME,
    documents=documents,
    metadata=metadatas,
    batch_size=64,
)
Retrieval
points = client.query(
    collection_name=COLLECTION_NAME,
    query_text="Can I split documents?",
    limit=10,
)
for i, point in enumerate(points):
    print(f"=== {i} ===")
    print(point.document)
    print()
=== 0 ===
Have you ever wondered how we, humans, would chunk? Here's a breakdown of a possible way a human would process a new document:
1. We start at the top of the document, treating the first part as a chunk.
   2. We continue down the document, deciding if a new sentence or piece of information belongs with the first chunk or should start a new one.
    3. We keep this up until we reach the end of the document.
The ultimate dream? Having an agent do this for you. But slow down! This approach is still being tested and isn't quite ready for the big leagues due to the time it takes to process multiple LLM calls and the cost of those calls. There's no implementation available in public libraries just yet. However, Greg Kamradt has his version available here.

=== 1 ===
Document Specific Chunking is a strategy that respects the document's structure. Rather than using a set number of characters or a recursive process, it creates chunks that align with the logical sections of the document, like paragraphs or subsections. This approach maintains the original author's organization of content and helps keep the text coherent. It makes the retrieved information more relevant and useful, particularly for structured documents with clearly defined sections.
Document Specific Chunking can handle a variety of document formats, such as:
Markdown
HTML
Python
etc
Here we’ll take Markdown as our example and use a modified version of our first sample text:
‍
The result is the following:
You can see here that with a chunk size of 105, the Markdown structure of the document is taken into account, and the chunks thus preserve the semantics of the text!

=== 2 ===
And there you have it! These chunking strategies are like a personal toolbox when it comes to implementing Retrieval Augmented Generation. They're a ton of ways to slice and dice text, each with its unique features and quirks. This variety gives you the freedom to pick the strategy that suits your project best, allowing you to tailor your approach to perfectly fit the unique needs of your work.
To put these strategies into action, there's a whole array of tools and libraries at your disposal. For example, llama_index is a fantastic tool that lets you create document indices and retrieve chunked documents. Let's not forget LangChain, another remarkable tool that makes implementing chunking strategies a breeze, particularly when dealing with multi-language data. Diving into these tools and understanding how they can work in harmony with the chunking strategies we've discussed is a crucial part of mastering Retrieval Augmented Generation.
By the way, if you're eager to experiment with your own examples using the chunking visualisation tool featured in this blog, feel free to give it a try! You can access it right here. Enjoy, and happy chunking! 😉

=== 3 ===
Retrieval Augmented Generation (RAG) has been a hot topic in understanding, interpreting, and generating text with AI for the last few months. It's like a wonderful union of retrieval-based and generative models, creating a playground for researchers, data scientists, and natural language processing enthusiasts, like you and me.
To truly control the results produced by our RAG, we need to understand chunking strategies and their role in the process of retrieving and generating text. Indeed, each chunking strategy enhances RAG's effectiveness in its unique way.
The goal of chunking is, as its name says, to chunk the information into multiple smaller pieces in order to store it in a more efficient and meaningful way. This allows the retrieval to capture pieces of information that are more related to the question at hand, and the generation to be more precise, but also less costly, as only a part of a document will be included in the LLM prompt, instead of the whole document.
Let's explore some chunking strategies together.
The methods mentioned in the article you're about to read usually make use of two key parameters. First, we have [chunk_size]— which controls the size of your text chunks. Then there's [chunk_overlap], which takes care of how much text overlaps between one chunk and the next.

=== 4 ===
Semantic Chunking considers the relationships within the text. It divides the text into meaningful, semantically complete chunks. This approach ensures the information's integrity during retrieval, leading to a more accurate and contextually appropriate outcome.
Semantic chunking involves taking the embeddings of every sentence in the document, comparing the similarity of all sentences with each other, and then grouping sentences with the most similar embeddings together.
By focusing on the text's meaning and context, Semantic Chunking significantly enhances the quality of retrieval. It's a top-notch choice when maintaining the semantic integrity of the text is vital.
However, this method does require more effort and is notably slower than the previous ones.
On our example text, since it is quite short and does not expose varied subjects, this method would only generate a single chunk.

=== 5 ===
Language models used in the rest of your possible RAG pipeline have a token limit, which should not be exceeded. When dividing your text into chunks, it's advisable to count the number of tokens. Plenty of tokenizers are available. To ensure accuracy, use the same tokenizer for counting tokens as the one used in the language model.
Consequently, there are also splitters available for this purpose.
For instance, by using the [SpacyTextSplitter] from LangChain, the following chunks are created:
‍

=== 6 ===
First things first, we have Character Chunking. This strategy divides the text into chunks based on a fixed number of characters. Its simplicity makes it a great starting point, but it can sometimes disrupt the text's flow, breaking sentences or words in unexpected places. Despite its limitations, it's a great stepping stone towards more advanced methods.
Now let’s see that in action with an example. Imagine a text that reads:
If we decide to set our chunk size to 100 and no chunk overlap, we'd end up with the following chunks. As you can see, Character Chunking can lead to some intriguing, albeit sometimes nonsensical, results, cutting some of the sentences in their middle.
By choosing a smaller chunk size,  we would obtain more chunks, and by setting a bigger chunk overlap, we could obtain something like this:
‍
Also, by default this method creates chunks character by character based on the empty character [’ ’]. But you can specify a different one in order to chunk on something else, even a complete word! For instance, by specifying [' '] as the separator, you can avoid cutting words in their middle.

=== 7 ===
Next, let's take a look at Recursive Character Chunking. Based on the basic concept of Character Chunking, this advanced version takes it up a notch by dividing the text into chunks until a certain condition is met, such as reaching a minimum chunk size. This method ensures that the chunking process aligns with the text's structure, preserving more meaning. Its adaptability makes Recursive Character Chunking great for texts with varied structures.
Again, let’s use the same example in order to illustrate this method. With a chunk size of 100, and the default settings for the other parameters, we obtain the following chunks:
