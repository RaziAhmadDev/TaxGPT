import uuid
from flask import Flask, jsonify, request
from werkzeug.utils import secure_filename
from pinecone import Pinecone, ServerlessSpec
from langchain_text_splitters import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import PineconeVectorStore
from pdf2image import convert_from_path
import pytesseract
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)


PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
pc = Pinecone(api_key=PINECONE_API_KEY)
spec = ServerlessSpec(cloud="aws", region="us-east-1")

model_name = "text-embedding-3-small"
embeddings = OpenAIEmbeddings(
    api_key=os.environ["OPENAI_API_KEY"], model=model_name
)


@app.route("/", methods=["GET"])
def index():
    return jsonify(message="Hello World!")


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if file:
        secure_filename(file.filename)
        filepath = os.path.join("/tmp", file.filename)
        file.save(filepath)

        images = convert_from_path(filepath)

        texts = []
        for img in images:
            text = pytesseract.image_to_string(img)
            texts.append(text)

        text_splitter = CharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
        documents = text_splitter.create_documents(texts)
        splits = text_splitter.split_documents(documents)

        embeddings = OpenAIEmbeddings(
            api_key=os.environ["OPENAI_API_KEY"], model=model_name
        )

        index_name = "langchain-retrieval-augmentation-fast"
        if index_name in pc.list_indexes().names():
            pc.delete_index(index_name)

        pc.create_index(index_name, dimension=1536, metric="cosine", spec=spec)

        vectorstore_from_docs = PineconeVectorStore.from_documents(
            splits, index_name=index_name, embedding=embeddings, namespace="ns-1"
        )

        vectorstore_from_docs.add_documents(splits, namespace="ns-1")

        return jsonify({"message": "File processed", "index_name": index_name}), 200


@app.route("/api/query", methods=["GET"])
def query():
    index_name = "langchain-retrieval-augmentation-fast"
    data = request.get_json()

    query = data.get("query")
    chat_history = data.get("chat_history")

    parsed_history = []

    for i in range(len(chat_history)):
        if i%2 == 0:
            parsed_history.append(HumanMessage(content=chat_history[i]))
        else:
            parsed_history.append(SystemMessage(content=chat_history[i]))


    index = pc.Index(index_name)
    vectorstore = PineconeVectorStore(index, embeddings, namespace="ns-1")
    retriever = vectorstore.as_retriever()

    llm = ChatOpenAI(
        openai_api_key=os.environ["OPENAI_API_KEY"],
        model_name="gpt-3.5-turbo",
        temperature=0.5,
    )

    contextualize_q_system_prompt = """Given a chat history and the latest user question \
    which might reference context in the chat history, formulate a standalone question \
    which can be understood without the chat history. Do NOT answer the question, \
    just reformulate it if needed and otherwise return it as is."""

    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )

    qa_system_prompt = """You are an expert tax officer here to assist someone with their questions on their W-2 Form. The person asking the questions is the one whom the W-2 Form belongs. \
    Under No circumstances will you reveal anyone's social security number. \
    Use the following pieces of retrieved context to answer the question. \
    If you don't know the answer, just say that you don't know. \
    Use three sentences maximum and keep the answer concise.\

    {context}"""
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", qa_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )

    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

    res = rag_chain.invoke({"input": query, "chat_history": parsed_history})

   
    return jsonify({"ai_response": res['answer']})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
