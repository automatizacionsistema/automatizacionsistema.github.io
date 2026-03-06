from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
db_name = os.environ.get("DB_NAME", "workflow_rpa_demo")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'flowrpa-secret-key-2024-demo')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

class Workflow(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    status: str = "active"
    user_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Execution(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workflow_id: str
    workflow_name: str
    status: str = "running"
    start_time: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    end_time: Optional[str] = None
    duration: Optional[int] = 0
    logs: List[str] = []
    results: Dict[str, Any] = {}
    user_id: str

class DashboardStats(BaseModel):
    total_workflows: int
    active_bots: int
    total_executions: int
    successful_executions: int
    failed_executions: int
    time_saved_hours: float
    cost_reduction_percentage: float
    recent_executions: List[Execution]

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    if token == "demo-token":
        demo_user_doc = await db.users.find_one({"email": "demo@flowrpa.com"}, {"_id": 0})
        if not demo_user_doc:
            demo_user = User(id="demo-user", email="demo@flowrpa.com", name="Usuario Demo")
            demo_doc = demo_user.model_dump()
            demo_doc["password_hash"] = pwd_context.hash("demo123")
            await db.users.insert_one(demo_doc)
            return demo_user
        return User(**demo_user_doc)

    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return User(**user_doc)

@api_router.post("/auth/register", response_model=Token)
async def register(user_input: UserRegister):
    existing_user = await db.users.find_one({"email": user_input.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user_input.password)
    user = User(email=user_input.email, name=user_input.name)
    user_doc = user.model_dump()
    user_doc["password_hash"] = hashed_password

    await db.users.insert_one(user_doc)

    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_input: UserLogin):
    user_doc = await db.users.find_one({"email": user_input.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pwd_context.verify(user_input.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/workflows", response_model=Workflow)
async def create_workflow(workflow_input: WorkflowCreate, current_user: User = Depends(get_current_user)):
    workflow = Workflow(**workflow_input.model_dump(), user_id=current_user.id)
    workflow_doc = workflow.model_dump()
    await db.workflows.insert_one(workflow_doc)
    return workflow

@api_router.get("/workflows", response_model=List[Workflow])
async def get_workflows(current_user: User = Depends(get_current_user)):
    workflows = await db.workflows.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    return workflows

@api_router.get("/workflows/{workflow_id}", response_model=Workflow)
async def get_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    workflow = await db.workflows.find_one({"id": workflow_id, "user_id": current_user.id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return Workflow(**workflow)

@api_router.put("/workflows/{workflow_id}", response_model=Workflow)
async def update_workflow(workflow_id: str, workflow_input: WorkflowCreate, current_user: User = Depends(get_current_user)):
    existing = await db.workflows.find_one({"id": workflow_id, "user_id": current_user.id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Workflow not found")

    update_data = workflow_input.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.workflows.update_one({"id": workflow_id}, {"$set": update_data})

    updated = await db.workflows.find_one({"id": workflow_id}, {"_id": 0})
    return Workflow(**updated)

@api_router.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    result = await db.workflows.delete_one({"id": workflow_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"message": "Workflow deleted successfully"}

@api_router.post("/workflows/{workflow_id}/execute", response_model=Execution)
async def execute_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    workflow = await db.workflows.find_one({"id": workflow_id, "user_id": current_user.id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    execution = Execution(
        workflow_id=workflow_id,
        workflow_name=workflow["name"],
        user_id=current_user.id,
        status="running"
    )

    logs = [
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Workflow execution started",
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Processing {len(workflow.get('nodes', []))} nodes"
    ]

    duration = random.randint(2, 15)

    for i, node in enumerate(workflow.get('nodes', []), 1):
        node_type = node.get('data', {}).get('label', 'Node')
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Executing node {i}: {node_type}")

    success = random.random() > 0.1

    if success:
        execution.status = "completed"
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Workflow completed successfully")
        execution.results = {
            "records_processed": random.randint(50, 500),
            "files_generated": random.randint(1, 5),
            "api_calls_made": random.randint(5, 20)
        }
    else:
        execution.status = "failed"
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Error: Connection timeout on API node")

    execution.end_time = datetime.now(timezone.utc).isoformat()
    execution.duration = duration
    execution.logs = logs

    execution_doc = execution.model_dump()
    await db.executions.insert_one(execution_doc)

    return execution

@api_router.get("/executions", response_model=List[Execution])
async def get_executions(current_user: User = Depends(get_current_user)):
    executions = await db.executions.find({"user_id": current_user.id}, {"_id": 0}).sort("start_time", -1).to_list(100)
    return executions

@api_router.get("/executions/{execution_id}", response_model=Execution)
async def get_execution(execution_id: str, current_user: User = Depends(get_current_user)):
    execution = await db.executions.find_one({"id": execution_id, "user_id": current_user.id}, {"_id": 0})
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return Execution(**execution)

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    total_workflows = await db.workflows.count_documents({"user_id": current_user.id})
    active_bots = await db.workflows.count_documents({"user_id": current_user.id, "status": "active"})
    total_executions = await db.executions.count_documents({"user_id": current_user.id})
    successful_executions = await db.executions.count_documents({"user_id": current_user.id, "status": "completed"})
    failed_executions = await db.executions.count_documents({"user_id": current_user.id, "status": "failed"})

    executions = await db.executions.find({"user_id": current_user.id}, {"_id": 0}).sort("start_time", -1).to_list(5)

    total_duration = sum([e.get("duration", 0) for e in executions])
    time_saved_hours = (total_executions * 2.5) + (total_duration / 60)

    return DashboardStats(
        total_workflows=total_workflows,
        active_bots=active_bots,
        total_executions=total_executions,
        successful_executions=successful_executions,
        failed_executions=failed_executions,
        time_saved_hours=round(time_saved_hours, 1),
        cost_reduction_percentage=60.0,
        recent_executions=[Execution(**e) for e in executions]
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"]
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
db_name = os.environ.get("DB_NAME", "workflow_rpa_demo")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'flowrpa-secret-key-2024-demo')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

class Workflow(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    status: str = "active"
    user_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Execution(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workflow_id: str
    workflow_name: str
    status: str = "running"
    start_time: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    end_time: Optional[str] = None
    duration: Optional[int] = 0
    logs: List[str] = []
    results: Dict[str, Any] = {}
    user_id: str

class DashboardStats(BaseModel):
    total_workflows: int
    active_bots: int
    total_executions: int
    successful_executions: int
    failed_executions: int
    time_saved_hours: float
    cost_reduction_percentage: float
    recent_executions: List[Execution]

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    
    if token == "demo-token":
        demo_user_doc = await db.users.find_one({"email": "demo@flowrpa.com"}, {"_id": 0})
        if not demo_user_doc:
            demo_user = User(id="demo-user", email="demo@flowrpa.com", name="Usuario Demo")
            demo_doc = demo_user.model_dump()
            demo_doc["password_hash"] = pwd_context.hash("demo123")
            await db.users.insert_one(demo_doc)
            return demo_user
        return User(**demo_user_doc)
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return User(**user_doc)

@api_router.post("/auth/register", response_model=Token)
async def register(user_input: UserRegister):
    existing_user = await db.users.find_one({"email": user_input.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user_input.password)
    user = User(email=user_input.email, name=user_input.name)
    user_doc = user.model_dump()
    user_doc["password_hash"] = hashed_password
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_input: UserLogin):
    user_doc = await db.users.find_one({"email": user_input.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not pwd_context.verify(user_input.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/workflows", response_model=Workflow)
async def create_workflow(workflow_input: WorkflowCreate, current_user: User = Depends(get_current_user)):
    workflow = Workflow(**workflow_input.model_dump(), user_id=current_user.id)
    workflow_doc = workflow.model_dump()
    await db.workflows.insert_one(workflow_doc)
    return workflow

@api_router.get("/workflows", response_model=List[Workflow])
async def get_workflows(current_user: User = Depends(get_current_user)):
    workflows = await db.workflows.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    return workflows

@api_router.get("/workflows/{workflow_id}", response_model=Workflow)
async def get_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    workflow = await db.workflows.find_one({"id": workflow_id, "user_id": current_user.id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return Workflow(**workflow)

@api_router.put("/workflows/{workflow_id}", response_model=Workflow)
async def update_workflow(workflow_id: str, workflow_input: WorkflowCreate, current_user: User = Depends(get_current_user)):
    existing = await db.workflows.find_one({"id": workflow_id, "user_id": current_user.id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    update_data = workflow_input.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.workflows.update_one({"id": workflow_id}, {"$set": update_data})
    
    updated = await db.workflows.find_one({"id": workflow_id}, {"_id": 0})
    return Workflow(**updated)

@api_router.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    result = await db.workflows.delete_one({"id": workflow_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"message": "Workflow deleted successfully"}

@api_router.post("/workflows/{workflow_id}/execute", response_model=Execution)
async def execute_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    workflow = await db.workflows.find_one({"id": workflow_id, "user_id": current_user.id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    execution = Execution(
        workflow_id=workflow_id,
        workflow_name=workflow["name"],
        user_id=current_user.id,
        status="running"
    )
    
    logs = [
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Workflow execution started",
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Processing {len(workflow.get('nodes', []))} nodes"
    ]
    
    duration = random.randint(2, 15)
    
    for i, node in enumerate(workflow.get('nodes', []), 1):
        node_type = node.get('data', {}).get('label', 'Node')
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Executing node {i}: {node_type}")
    
    success = random.random() > 0.1
    
    if success:
        execution.status = "completed"
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Workflow completed successfully")
        execution.results = {
            "records_processed": random.randint(50, 500),
            "files_generated": random.randint(1, 5),
            "api_calls_made": random.randint(5, 20)
        }
    else:
        execution.status = "failed"
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Error: Connection timeout on API node")
    
    execution.end_time = datetime.now(timezone.utc).isoformat()
    execution.duration = duration
    execution.logs = logs
    
    execution_doc = execution.model_dump()
    await db.executions.insert_one(execution_doc)
    
    return execution

@api_router.get("/executions", response_model=List[Execution])
async def get_executions(current_user: User = Depends(get_current_user)):
    executions = await db.executions.find({"user_id": current_user.id}, {"_id": 0}).sort("start_time", -1).to_list(100)
    return executions

@api_router.get("/executions/{execution_id}", response_model=Execution)
async def get_execution(execution_id: str, current_user: User = Depends(get_current_user)):
    execution = await db.executions.find_one({"id": execution_id, "user_id": current_user.id}, {"_id": 0})
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return Execution(**execution)

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    total_workflows = await db.workflows.count_documents({"user_id": current_user.id})
    active_bots = await db.workflows.count_documents({"user_id": current_user.id, "status": "active"})
    total_executions = await db.executions.count_documents({"user_id": current_user.id})
    successful_executions = await db.executions.count_documents({"user_id": current_user.id, "status": "completed"})
    failed_executions = await db.executions.count_documents({"user_id": current_user.id, "status": "failed"})
    
    executions = await db.executions.find({"user_id": current_user.id}, {"_id": 0}).sort("start_time", -1).to_list(5)
    
    total_duration = sum([e.get("duration", 0) for e in executions])
    time_saved_hours = (total_executions * 2.5) + (total_duration / 60)
    
    return DashboardStats(
        total_workflows=total_workflows,
        active_bots=active_bots,
        total_executions=total_executions,
        successful_executions=successful_executions,
        failed_executions=failed_executions,
        time_saved_hours=round(time_saved_hours, 1),
        cost_reduction_percentage=60.0,
        recent_executions=[Execution(**e) for e in executions]
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
