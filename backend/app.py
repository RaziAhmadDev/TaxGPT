import datetime
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
from flask_cors import CORS
from flask_bcrypt import Bcrypt

from dotenv import load_dotenv
import os

from pymongo import MongoClient

client = MongoClient("mongodb+srv://razi6037:FNjDoir5c0Vc0jW8@cluster0.d6e8obf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client.Database
users = db.users
indexes = db.vector_indexes


load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
bcrypt = Bcrypt(app)

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
pc = Pinecone(api_key=PINECONE_API_KEY)
spec = ServerlessSpec(cloud="aws", region="us-east-1")

model_name = "text-embedding-3-small"
embeddings = OpenAIEmbeddings(
    api_key=os.environ["OPENAI_API_KEY"], model=model_name
)

def get_available_index():
    index_names = [f'vector-index{i}' for i in range(5)]
    index_ts = []
    for index_name in index_names:
        index = indexes.find_one({index_name: index_name})
        if not (index and index.get("last_updated_ts")):
            return index_name
        else:
            index_ts.append((index_name, index.get("last_updated_ts")))

    index_ts = sorted(index_ts, key=lambda x: x[1])
    return index_ts[0][0]

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    users.insert_one({
        "name": name,
        "email": email,
        "password": hashed_password
    })

    return jsonify({"message": "User created successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = users.find_one({"email": email})

    if user and bcrypt.check_password_hash(user['password'], password):
        return jsonify({"message": "Login successful"}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401


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

        index_name = get_available_index()
        if index_name in pc.list_indexes().names():
            pc.delete_index(index_name)

        pc.create_index(index_name, dimension=1536, metric="cosine", spec=spec)
        indexes.update_one({index_name: index_name}, {"$set": {"last_updated_ts": datetime.datetime.now()}}, upsert=True)

        vectorstore_from_docs = PineconeVectorStore.from_documents(
            splits, index_name=index_name, embedding=embeddings, namespace="ns-1"
        )

        vectorstore_from_docs.add_documents(splits, namespace="ns-1")

        return jsonify({"message": "File processed", "index_name": index_name}), 200


@app.route("/api/query", methods=["POST"])
def query():
    data = request.get_json()

    query = data.get("query")
    chat_history = data.get("chat_history")
    index_name = data.get("index_name")

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

    qa_system_prompt = """You are an expert and professional tax officer here to assist someone with their questions on their W-2 Form. The person asking the questions is the one whom the W-2 Form belongs. \
    Under No circumstances will you reveal anyone's social security number, in any form at all, when directly asked, or mentioned as part of any summary. If you must mention it, mention it as XXX-XX-XXXX  \
    Under No circumstances will you tell the person that they should consult a tax professional since you are that tax professional. \
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
