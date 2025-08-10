# Documentação de Setup e Resultados de Produção

Este documento detalha as condições necessárias para iniciar o processamento de um edital e a estrutura de dados do resultado final gerado pelo pipeline.

## Condições de Iniciação do Processamento

O pipeline de processamento é iniciado através de uma requisição `POST` para o endpoint `/api/v1/editais/processar`. As seguintes condições e parâmetros são necessários:

### Requisitos Obrigatórios

1.  **Autenticação:** A requisição deve conter um token JWT válido no cabeçalho de autorização (`Authorization: Bearer <token>`) para autenticar um usuário existente no sistema.
2.  **Arquivo (`file`):** A requisição deve ser do tipo `multipart/form-data` e conter um arquivo. 
    *   **Formato:** O arquivo deve ser obrigatoriamente um PDF (`.pdf`). O sistema validará a extensão do arquivo.

### Parâmetros Opcionais

Estes parâmetros podem ser enviados no corpo da requisição `multipart/form-data` para enriquecer os metadados e ajudar na organização dos arquivos:

*   **`ano` (integer):** O ano do pregão. Usado para organizar os arquivos em `storage/{ano}`.
*   **`uasg` (string):** O código da Unidade Administrativa de Serviços Gerais (UASG). Usado para organizar os arquivos em `storage/{ano}/{uasg}`.
*   **`numero_pregao` (string):** O número de identificação do pregão. Usado para organizar os arquivos em `storage/{ano}/{uasg}/{numero_pregao}`.
*   **`callback_url` (string):** Uma URL para a qual o sistema enviará uma notificação `POST` quando o processamento for concluído (seja com sucesso ou falha). Isso permite a integração com sistemas externos de forma assíncrona.

---

## Estrutura do Resultado Final

Após a conclusão bem-sucedida do pipeline, um arquivo `resultado.json` é gerado e armazenado. A estrutura de dados deste JSON é a seguinte:

```json
{
  "task_id": "string",
  "file_path": "string",
  "structured_data": {},
  "tables": [],
  "product_tables": [],
  "risks": [],
  "opportunities": [],
  "quality_score": "float",
  "processing_times": {},
  "errors": [],
  "warnings": [],
  "analysis": {},
  "timestamp": "string (ISO 8601)"
}
```

### Detalhamento dos Campos

*   **`task_id`**: (string) O identificador único da tarefa de processamento.
*   **`file_path`**: (string) O caminho absoluto no sistema de arquivos onde o PDF original foi salvo.
*   **`structured_data`**: (object) Um objeto contendo as informações-chave extraídas pela IA. Exemplo:
    ```json
    {
      "numero_pregao": "PE-001-2025",
      "uasg": "986531",
      "orgao": "Ministério da Gestão",
      "objeto": "Contratação de serviços de TI...",
      "valor_estimado": 500000.00,
      "data_abertura": "2025-01-15T10:30:00",
      "modalidade": "Pregão Eletrônico"
    }
    ```
*   **`tables`**: (array) Uma lista de todas as tabelas encontradas no documento, com seus dados brutos e tipo classificado.
*   **`product_tables`**: (array) Uma lista contendo apenas as tabelas classificadas como "produtos", com seus dados já limpos e estruturados em um formato padrão (item, descrição, quantidade, preço, etc.).
*   **`risks`**: (array) Uma lista de objetos, onde cada objeto representa um risco identificado, contendo sua descrição, tipo (técnico, legal, comercial), probabilidade, impacto e um score de criticidade.
*   **`opportunities`**: (array) Uma lista de objetos, onde cada objeto representa uma oportunidade de negócio encontrada (ex: alto volume, alto valor, contrato recorrente).
*   **`quality_score`**: (float) Uma pontuação de 0 a 100 que representa a confiança do sistema na qualidade e completude da extração.
*   **`processing_times`**: (object) Um objeto que detalha o tempo gasto (em segundos) em cada um dos 14 estágios do pipeline.
*   **`errors`**: (array) Uma lista de mensagens de erro que ocorreram em estágios não-críticos do pipeline. Se um erro crítico ocorre, o processo falha e este campo não é gerado.
*   **`warnings`**: (array) Uma lista de avisos sobre anomalias encontradas durante o processamento que não impediram a sua continuação.
*   **`analysis`**: (object) Um campo de "bastidores" que contém dados intermediários do processo, como as respostas brutas da IA, metadados do PDF, etc. Útil para depuração.
*   **`timestamp`**: (string) A data e hora no formato ISO 8601 de quando o resultado final foi compilado.

---

## Personalização da Análise de Risco

Para permitir que cada cliente adapte a análise de riscos à sua realidade operacional e comercial, o sistema pode ser configurado com fatores de multiplicação de risco. A implementação sugerida é através de um arquivo de configuração (`config_risco_cliente.json`) que o sistema carrega antes de iniciar o processamento.

### Parâmetros de Risco Personalizáveis

| Parâmetro | Descrição do Risco | Exemplo de Gatilho no Edital |
| :--- | :--- | :--- |
| `fator_prazo_entrega` | Risco associado a prazos de entrega curtos. | "Entrega em até 5 dias úteis." |
| `fator_local_entrega` | Risco logístico de entregar em locais distantes ou de difícil acesso. | "Local de entrega: Manaus/AM." |
| `fator_valor_total` | Risco financeiro associado a contratos de valor muito alto (impacto no fluxo de caixa). | "Valor estimado do lote: R$ 2.500.000,00." |
| `fator_condicao_pagamento` | Risco de fluxo de caixa devido a prazos de pagamento longos. | "O pagamento será realizado 60 dias após a entrega." |
| `fator_garantia_produto` | Risco/custo de pós-venda associado a garantias extensas. | "Garantia mínima de 24 meses para todos os itens." |
| `fator_requisitos_tecnicos` | Risco de não conformidade com especificações técnicas muito restritas ou fora do padrão. | "O equipamento deve possuir o protocolo proprietário XYZ." |
| `fator_penalidades` | Risco financeiro devido a multas e penalidades contratuais altas. | "Multa de 2% por dia de atraso na entrega." |
| `fator_certificacoes_exigidas`| Risco de não possuir certificações específicas obrigatórias. | "A empresa deverá apresentar a certificação ISO 14001." |

### Exemplo de Implementação (`config_risco_cliente.json`)

O cliente pode definir seus próprios multiplicadores (onde `1.0` é o padrão) e os limites que ativam esses fatores.

```json
{
  "fatores_risco": {
    "fator_prazo_entrega": 1.5,
    "fator_local_entrega": 1.2,
    "fator_valor_total": 1.1,
    "fator_condicao_pagamento": 1.7,
    "fator_garantia_produto": 1.4,
    "fator_requisitos_tecnicos": 1.9,
    "fator_penalidades": 1.3,
    "fator_certificacoes_exigidas": 1.8
  },
  "limites": {
    "prazo_entrega_curto_dias": 10,
    "valor_total_alto_reais": 1000000,
    "pagamento_longo_dias": 45,
    "garantia_longa_meses": 12
  }
}
```

O serviço `risk_analyzer.py` seria então responsável por carregar este arquivo e aplicar os multiplicadores (`fatores_risco`) ao score de risco sempre que uma das condições de `limites` for atingida.

---

## Integração com Ferramentas de Extração Avançada (IBM Docling e spaCy-layout)

Para aprimorar a precisão e a riqueza da extração de dados de editais, o sistema pode ser integrado com o **IBM Docling** e o **spaCy-layout**. Essas ferramentas atuam como um serviço de pré-processamento especializado, transformando PDFs não estruturados em um formato rico e contextualizado para análise subsequente.

### Papel no Pipeline de Processamento

A integração modifica os estágios iniciais do pipeline de processamento de editais (`app/services/edital_processor.py`) da seguinte forma:

1.  **Substituição de Estágios Iniciais**: Os estágios de `TEXT_EXTRACTION`, `OCR_PROCESSING` e `TABLE_EXTRACTION` são substituídos ou significativamente aprimorados pela funcionalidade do Docling.
2.  **Processamento com Docling**: O PDF de entrada é enviado ao Docling, que realiza:
    *   OCR (se necessário) com alta precisão.
    *   Análise de layout para compreender a estrutura do documento.
    *   Extração de texto e tabelas com alta fidelidade.
3.  **Enriquecimento com spaCy-layout**: O output do Docling é então processado pelo `spacy-layout`, que o converte em um objeto `Doc` do spaCy. Este objeto é enriquecido com metadados de layout, incluindo coordenadas (bounding boxes), números de página e tipos de elementos (títulos, parágrafos, células de tabela).
4.  **Dados Contextualizados para IA**: O objeto `Doc` do spaCy, agora contendo informações textuais e de layout, é passado para os estágios de análise de IA (como `RISK_ANALYSIS` e `OPPORTUNITY_IDENTIFICATION`). Isso permite que o Llama 3.2 e outros modelos realizem consultas e análises muito mais inteligentes e contextuais, como identificar entidades dentro de seções específicas ou analisar dados de tabelas com base em sua localização no documento.

### Vantagens da Integração

*   **Aumento da Precisão**: Redução drástica de erros na extração de texto e tabelas, especialmente em documentos complexos.
*   **Análise Contextual Aprimorada**: A capacidade de correlacionar texto com sua posição e tipo de elemento no documento permite análises de risco e oportunidade mais sofisticadas e precisas.
*   **Otimização do LLM**: Com dados de entrada mais limpos e estruturados, o LLM pode focar em tarefas de raciocínio de alto nível, em vez de gastar recursos na interpretação do layout do PDF.
*   **Simplificação do Pipeline**: Potencial unificação e simplificação de múltiplos estágios de extração em uma única chamada robusta.

### Impacto na Estrutura do Resultado Final (`resultado.json`)

Embora a estrutura principal do `resultado.json` permaneça a mesma, a qualidade e a profundidade dos dados nos campos `structured_data`, `tables`, `product_tables`, `risks`, `opportunities` e, especialmente, `analysis` serão significativamente aprimoradas. O campo `analysis` poderá conter representações mais ricas do documento, como o objeto `Doc` do spaCy serializado ou informações derivadas dele, facilitando a depuração e auditoria.

```

## Enriquecimento de Análise com `spacy-layout`

Uma abordagem alternativa ou complementar ao uso direto do Docling é a utilização do `spacy-layout`, um plugin para a biblioteca spaCy. Esta abordagem é poderosa porque **funde a análise de layout de documentos com as capacidades de processamento de linguagem natural (NLP) do spaCy**.

### Papel no Ecossistema

O `spacy-layout` utiliza o Docling nos bastidores para analisar o PDF, mas em vez de simplesmente retornar um arquivo JSON ou Markdown, ele produz um objeto `Doc` do spaCy. Este objeto é enriquecido com informações de layout, permitindo análises muito mais sofisticadas.

Com esta abordagem, é possível não apenas ter o texto, mas saber **onde** no documento ele estava (página, coordenadas) e **o que** ele era (título, parágrafo, item de lista, célula de tabela).

### Vantagens da Integração

*   **Análise Contextual**: Permite fazer perguntas específicas como: "Quais entidades (empresas, valores) foram mencionadas dentro da seção `HABILITAÇÃO` na página 5?" ou "Este requisito técnico está dentro de uma tabela ou no corpo do texto?".
*   **Integração Nativa com NLP**: Facilita a aplicação de outras ferramentas do spaCy, como reconhecimento de entidades nomeadas (NER), análise de dependências e classificação de texto, diretamente nos elementos estruturados do documento.
*   **Flexibilidade**: Oferece um controle mais granular sobre o texto extraído, permitindo a criação de regras e lógicas de análise mais complexas.

### Exemplo de Implementação

O exemplo abaixo mostra como processar um edital e acessar seus elementos de layout, como tabelas e seções específicas.

```python
import spacy
from spacy_layout import spaCyLayout
import pandas as pd

# Carregar um modelo spaCy (pode ser um modelo em português)
nlp = spacy.blank("pt")

# Inicializar o processador de layout
layout_parser = spaCyLayout(nlp)

# Processar o edital para gerar um objeto Doc enriquecido
doc = layout_parser("caminho/para/seu/edital.pdf")

# --- Exemplo 1: Acessar Tabelas como DataFrames ---
print("--- Tabelas Encontradas ---")
for i, table in enumerate(doc._.tables):
    print(f"Tabela {i+1} (Página {table._.page_number}):")
    # Acessa a tabela como um DataFrame do pandas
    df: pd.DataFrame = table._.data
    print(df.head())
    print("\n")

# --- Exemplo 2: Encontrar texto em seções específicas ---
print("--- Análise de Seções ---")
for span in doc.spans["layout"]:
    # span.label_ pode ser 'title', 'section_header', 'paragraph', 'list_item', etc.
    if span.label_ == "section_header":
        print(f"[CABEÇALHO DE SEÇÃO] (Página {span._.page_number}): {span.text.strip()}")
    elif span.label_ == "list_item":
        print(f"  [Item de Lista]: {span.text.strip()}")

```

Integrar o `spacy-layout` ao pipeline significaria que o `context.raw_text` não seria mais uma string simples, mas sim um objeto `Doc` do spaCy, permitindo que os estágios de `RISK_ANALYSIS` e `OPPORTUNITY_IDENTIFICATION` realizassem consultas muito mais inteligentes e contextuais sobre o conteúdo do edital.

```