import React, { useState } from 'react';
import styled from 'styled-components';

const TaskListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  color: #0078d4;
  margin-bottom: 1rem;
`;

const TaskControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
`;

const SearchInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
  max-width: 300px;
  
  @media (max-width: 768px) {
    max-width: none;
  }
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
`;

const AddTaskButton = styled.button`
  background-color: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #005a9e;
  }
`;

const TaskItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f0f0f0;
  }
  
  ${props => props.completed && `
    background-color: #f0f7ff;
    text-decoration: line-through;
    color: #888;
  `}
`;

const TaskCheckbox = styled.input`
  width: 20px;
  height: 20px;
  margin-right: 1rem;
  cursor: pointer;
`;

const TaskContent = styled.div`
  flex: 1;
`;

const TaskName = styled.div`
  font-weight: 500;
`;

const TaskDetails = styled.div`
  display: flex;
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const TaskDetail = styled.span`
  margin-right: 1rem;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.25rem;
  }
`;

const TaskActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background-color: transparent;
  border: none;
  color: ${props => props.color || '#0078d4'};
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const FormModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const TaskForm = styled.form`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const FormTitle = styled.h3`
  margin-bottom: 1.5rem;
  color: #0078d4;
`;

const FormField = styled.div`
  margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
`;

const FormButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const CancelButton = styled.button`
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const SubmitButton = styled.button`
  background-color: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background-color: #005a9e;
  }
`;

const TaskList = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      name: 'Analyze document with Azure Form Recognizer',
      description: 'Use Azure Form Recognizer to extract structured data from uploaded invoice documents',
      dueDate: '2025-05-15',
      status: 'In Progress',
      priority: 'High',
      completed: false,
      assignedTo: 'John Doe'
    },
    {
      id: 2,
      name: 'Set up Azure AI Search index',
      description: 'Create a search index for document discovery and retrieval',
      dueDate: '2025-05-10',
      status: 'Not Started',
      priority: 'Medium',
      completed: false,
      assignedTo: 'Jane Smith'
    },
    {
      id: 3,
      name: 'Implement OpenAI integration',
      description: 'Connect the application to Azure OpenAI for document analysis and question answering',
      dueDate: '2025-05-20',
      status: 'Not Started',
      priority: 'High',
      completed: false,
      assignedTo: 'John Doe'
    },
    {
      id: 4,
      name: 'Deploy Azure Function for background processing',
      description: 'Create and deploy an Azure Function that will handle background processing of documents',
      dueDate: '2025-05-08',
      status: 'Completed',
      priority: 'Medium',
      completed: true,
      assignedTo: 'Jane Smith'
    }
  ]);
  
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  
  const addTask = () => {
    setCurrentTask(null);
    setShowModal(true);
  };
  
  const editTask = (task) => {
    setCurrentTask(task);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setCurrentTask(null);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const taskData = {
      name: formData.get('name'),
      description: formData.get('description'),
      dueDate: formData.get('dueDate'),
      status: formData.get('status'),
      priority: formData.get('priority'),
      assignedTo: formData.get('assignedTo'),
      completed: formData.get('status') === 'Completed'
    };
    
    if (currentTask) {
      // Editing existing task
      setTasks(tasks.map(task => 
        task.id === currentTask.id ? { ...task, ...taskData } : task
      ));
    } else {
      // Adding new task
      setTasks([...tasks, {
        id: Date.now(),
        ...taskData
      }]);
    }
    
    closeModal();
  };
  
  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { 
            ...task, 
            completed: !task.completed, 
            status: !task.completed ? 'Completed' : 'In Progress' 
          } 
        : task
    ));
  };
  
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  const filteredTasks = tasks.filter(task => {
    // Filter by status
    if (filter !== 'all' && task.status !== filter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.name.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.assignedTo.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  return (
    <TaskListContainer>
      <Title>Task List</Title>
      
      <TaskControls>
        <SearchInput 
          type="text" 
          placeholder="Search tasks..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Tasks</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </FilterSelect>
        
        <AddTaskButton onClick={addTask}>
          Add Task
        </AddTaskButton>
      </TaskControls>
      
      {filteredTasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        filteredTasks.map(task => (
          <TaskItem key={task.id} completed={task.completed}>
            <TaskCheckbox 
              type="checkbox" 
              checked={task.completed}
              onChange={() => toggleTaskCompletion(task.id)}
            />
            
            <TaskContent>
              <TaskName>{task.name}</TaskName>
              <TaskDetails>
                <TaskDetail>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17 13H11V7H13V11H17V13Z" fill="#666"/>
                  </svg>
                  Due: {task.dueDate}
                </TaskDetail>
                
                <TaskDetail>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill={
                      task.priority === 'High' ? '#f5222d' : 
                      task.priority === 'Medium' ? '#fa8c16' : '#52c41a'
                    }/>
                  </svg>
                  {task.priority}
                </TaskDetail>
                
                <TaskDetail>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#666"/>
                  </svg>
                  {task.assignedTo}
                </TaskDetail>
              </TaskDetails>
            </TaskContent>
            
            <TaskActions>
              <ActionButton onClick={() => editTask(task)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="#0078d4"/>
                </svg>
              </ActionButton>
              
              <ActionButton color="#f5222d" onClick={() => deleteTask(task.id)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="#f5222d"/>
                </svg>
              </ActionButton>
            </TaskActions>
          </TaskItem>
        ))
      )}
      
      {showModal && (
        <FormModal>
          <TaskForm onSubmit={handleSubmit}>
            <FormTitle>
              {currentTask ? 'Edit Task' : 'Add New Task'}
            </FormTitle>
            
            <FormField>
              <FormLabel htmlFor="name">Task Name</FormLabel>
              <FormInput 
                type="text" 
                id="name" 
                name="name" 
                defaultValue={currentTask?.name || ''}
                required
              />
            </FormField>
            
            <FormField>
              <FormLabel htmlFor="description">Description</FormLabel>
              <FormTextarea 
                id="description" 
                name="description" 
                defaultValue={currentTask?.description || ''}
              />
            </FormField>
            
            <FormField>
              <FormLabel htmlFor="dueDate">Due Date</FormLabel>
              <FormInput 
                type="date" 
                id="dueDate" 
                name="dueDate" 
                defaultValue={currentTask?.dueDate || ''}
                required
              />
            </FormField>
            
            <FormField>
              <FormLabel htmlFor="status">Status</FormLabel>
              <FormSelect 
                id="status" 
                name="status" 
                defaultValue={currentTask?.status || 'Not Started'}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </FormSelect>
            </FormField>
            
            <FormField>
              <FormLabel htmlFor="priority">Priority</FormLabel>
              <FormSelect 
                id="priority" 
                name="priority" 
                defaultValue={currentTask?.priority || 'Medium'}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </FormSelect>
            </FormField>
            
            <FormField>
              <FormLabel htmlFor="assignedTo">Assigned To</FormLabel>
              <FormInput 
                type="text" 
                id="assignedTo" 
                name="assignedTo" 
                defaultValue={currentTask?.assignedTo || ''}
                required
              />
            </FormField>
            
            <FormButtons>
              <CancelButton type="button" onClick={closeModal}>
                Cancel
              </CancelButton>
              <SubmitButton type="submit">
                {currentTask ? 'Update Task' : 'Add Task'}
              </SubmitButton>
            </FormButtons>
          </TaskForm>
        </FormModal>
      )}
    </TaskListContainer>
  );
};

export default TaskList;
