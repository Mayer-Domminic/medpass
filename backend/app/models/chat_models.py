from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, Identity, DateTime, Numeric, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from pgvector.sqlalchemy import Vector
from app.core.base import Base
import datetime

class ChatConversation(Base):
    __tablename__ = 'chatconversation'
    
    conversationid = Column('conversationid', Integer, Identity(start=1, increment=1), primary_key=True)
    userid = Column('userid', Integer, ForeignKey('logininfo.logininfoid'))
    title = Column('title', String(255))
    createdat = Column('createdat', DateTime, default=func.now())
    updatedat = Column('updatedat', DateTime, default=func.now(), onupdate=func.now())
    isactive = Column('isactive', Boolean, default=True)
    totaltokensinput = Column('totaltokensinput', Integer, default=0)
    totaltokensoutput = Column('totaltokensoutput', Integer, default=0)
    totalcost = Column('totalcost', Numeric(10, 6), default=0.0)
    
    messages = relationship('ChatMessage', back_populates='conversation')
    contexts = relationship('ChatContext', back_populates='source_conversation')

class ChatContext(Base):
    __tablename__ = 'chatcontext'
    
    contextid = Column('contextid', Integer, Identity(start=1, increment=1), primary_key=True)
    conversationid = Column('conversationid', Integer, ForeignKey('chatconversation.conversationid'), nullable=True)
    title = Column('title', String(255), nullable=False)
    # Using Text as it does not have a limit
    content = Column('content', Text, nullable=False)
    embedding = Column('embedding', Vector(768), nullable=True)
    createdat = Column('createdat', DateTime, default=func.now())
    updatedat = Column('updatedat', DateTime, default=func.now(), onupdate=func.now())
    isactive = Column('isactive', Boolean, default=True)
    importancescore = Column('importancescore', Float)
    createdby = Column('createdby', Integer, ForeignKey('logininfo.logininfoid'))
    # Using JSONB to store metadata that can change for every conversation/context
    # This can be the topic, temperature for models, client, (web, mobile, etc), and other information
    # This slot can be different everytime. 
    chatmetadata = Column('metadata', JSONB)
    
    message_links = relationship('ChatMessageContext', back_populates='context')
    source_conversation = relationship('ChatConversation', back_populates='contexts')
    
class ChatMessage(Base):
    __tablename__ = 'chatmessage'
    
    messageid = Column('messageid', Integer, Identity(start=1, increment=1), primary_key=True)
    conversationid = Column('conversationid', Integer, ForeignKey('chatconversation.conversationid', ondelete='CASCADE'))
    # This is a flag to determine if it's the user or the model sending a message
    sendertype = Column('sendertype', String(20), nullable=False)
    content = Column('content', Text, nullable=False)
    embedding = Column('embedding', Vector(768), nullable=True)
    timestamp = Column('timestamp', DateTime, default=func.now())
    tokensinput = Column('tokensinput', Integer, default=0)
    tokensoutput = Column('tokensoutput', Integer, default=0)
    messagecost = Column('messagecost', Numeric(10, 6), default=0.0)
    messagemetadata = Column('metadata', JSONB)
    
    conversation = relationship('ChatConversation', back_populates='messages')
    context_links = relationship('ChatMessageContext', back_populates='message')
    
class ChatMessageContext(Base):
    __tablename__ = 'chatmessagecontext'
    
    messagecontextid = Column('messagecontextid', Integer, Identity(start=1, increment=1), primary_key=True)
    messageid = Column('messageid', Integer, ForeignKey('chatmessage.messageid', ondelete='CASCADE'))
    contextid = Column('contextid', Integer, ForeignKey('chatcontext.contextid', ondelete='CASCADE'))
    relevancescore = Column('relevancescore', Float)
    wasused = Column('wasused', Boolean, default=False)
    
    message = relationship('ChatMessage', back_populates='context_links')
    context = relationship('ChatContext', back_populates='message_links')