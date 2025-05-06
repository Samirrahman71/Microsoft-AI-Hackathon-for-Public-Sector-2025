import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const DashboardContainer = styled.div`
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

const ResourceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ResourceCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  border-left: 4px solid ${props => props.color || '#0078d4'};
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ResourceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ResourceTitle = styled.h3`
  margin: 0;
  font-weight: 500;
  color: #333;
`;

const ResourceStatus = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: ${props => {
    switch(props.status) {
      case 'Healthy': return '#e6f7ee';
      case 'Warning': return '#fff7e6';
      case 'Critical': return '#fff1f0';
      case 'Stopped': return '#f5f5f5';
      default: return '#f0f0f0';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'Healthy': return '#52c41a';
      case 'Warning': return '#fa8c16';
      case 'Critical': return '#f5222d';
      case 'Stopped': return '#8c8c8c';
      default: return '#666';
    }
  }};
`;

const ResourceDetails = styled.div`
  margin-top: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const DetailLabel = styled.span`
  color: #666;
`;

const DetailValue = styled.span`
  font-weight: 500;
`;

const ResourceActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  background-color: transparent;
  color: #0078d4;
  border: 1px solid #0078d4;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f0f7ff;
  }
`;

const ChartContainer = styled.div`
  height: 200px;
  margin-top: 1rem;
  position: relative;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
`;

const Chart = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${props => props.value}%;
  background: linear-gradient(to bottom, #0078d4, #00a2ed);
  transition: height 1s ease-in-out;
`;

const OverviewMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MetricCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #0078d4;
  margin-bottom: 0.5rem;
`;

const MetricLabel = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
`;

const FilterInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
`;

const ResourceDashboard = () => {
  const [resources, setResources] = useState([
    {
      id: 1,
      name: 'App Service Plan (Production)',
      type: 'App Service Plan',
      status: 'Healthy',
      region: 'East US',
      resourceGroup: 'production-rg',
      metrics: {
        cpu: 42,
        memory: 65,
        instances: 3,
        requests: 1280
      },
      details: {
        tier: 'Premium v3',
        pricing: 'P1v3',
        cores: '2 vCPU',
        ram: '8 GiB'
      }
    },
    {
      id: 2,
      name: 'Document Processing Function',
      type: 'Function App',
      status: 'Warning',
      region: 'East US',
      resourceGroup: 'production-rg',
      metrics: {
        executions: 87,
        errors: 12,
        avgDuration: 843,
        memory: 72
      },
      details: {
        plan: 'Consumption',
        runtime: 'Node.js 18',
        state: 'Running',
        os: 'Linux'
      }
    },
    {
      id: 3,
      name: 'Document Storage',
      type: 'Storage Account',
      status: 'Healthy',
      region: 'East US',
      resourceGroup: 'production-rg',
      metrics: {
        availability: 100,
        usedCapacity: 247,
        transactions: 5630,
        egress: 14.5
      },
      details: {
        replication: 'GRS',
        performance: 'Standard',
        access: 'Hot',
        encryption: 'AES-256'
      }
    },
    {
      id: 4,
      name: 'Document Search Service',
      type: 'Cognitive Search',
      status: 'Healthy',
      region: 'East US',
      resourceGroup: 'production-rg',
      metrics: {
        queryLatency: 78,
        searchUnits: 2,
        documentCount: 15432,
        indexCount: 3
      },
      details: {
        tier: 'Standard',
        partitions: 1,
        replicas: 2,
        hosting: 'Default'
      }
    },
    {
      id: 5,
      name: 'Document Analysis Service',
      type: 'AI Document Intelligence',
      status: 'Warning',
      region: 'East US',
      resourceGroup: 'production-rg',
      metrics: {
        requestCount: 924,
        errorRate: 3.2,
        latency: 210,
        throttledRequests: 10
      },
      details: {
        tier: 'Standard',
        version: 'v3.0',
        customModels: 2,
        endpoints: 1
      }
    }
  ]);
  
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredResources = resources.filter(resource => {
    // Filter by status
    if (filter !== 'all' && resource.status !== filter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        resource.name.toLowerCase().includes(query) ||
        resource.type.toLowerCase().includes(query) ||
        resource.resourceGroup.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Calculate total metrics across all resources
  const totalMetrics = {
    resources: resources.length,
    healthy: resources.filter(r => r.status === 'Healthy').length,
    warning: resources.filter(r => r.status === 'Warning').length,
    critical: resources.filter(r => r.status === 'Critical').length
  };

  // Restart a resource (simulated)
  const restartResource = (id) => {
    setResources(resources.map(resource => 
      resource.id === id ? { ...resource, status: 'Healthy' } : resource
    ));
  };

  return (
    <DashboardContainer>
      <Title>Azure Resource Dashboard</Title>
      
      <OverviewMetrics>
        <MetricCard>
          <MetricValue>{totalMetrics.resources}</MetricValue>
          <MetricLabel>Total Resources</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{totalMetrics.healthy}</MetricValue>
          <MetricLabel>Healthy</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{totalMetrics.warning}</MetricValue>
          <MetricLabel>Warning</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{totalMetrics.critical}</MetricValue>
          <MetricLabel>Critical</MetricLabel>
        </MetricCard>
      </OverviewMetrics>
      
      <FilterBar>
        <FilterInput 
          type="text" 
          placeholder="Search resources..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Resources</option>
          <option value="Healthy">Healthy</option>
          <option value="Warning">Warning</option>
          <option value="Critical">Critical</option>
          <option value="Stopped">Stopped</option>
        </FilterSelect>
        
        <FilterSelect>
          <option value="all">All Resource Types</option>
          <option value="App Service Plan">App Service Plan</option>
          <option value="Function App">Function App</option>
          <option value="Storage Account">Storage Account</option>
          <option value="Cognitive Search">Cognitive Search</option>
          <option value="AI Document Intelligence">AI Document Intelligence</option>
        </FilterSelect>
      </FilterBar>
      
      <ResourceGrid>
        {filteredResources.map(resource => (
          <ResourceCard 
            key={resource.id}
            color={
              resource.status === 'Healthy' ? '#52c41a' :
              resource.status === 'Warning' ? '#fa8c16' :
              resource.status === 'Critical' ? '#f5222d' :
              '#8c8c8c'
            }
          >
            <ResourceHeader>
              <ResourceTitle>{resource.name}</ResourceTitle>
              <ResourceStatus status={resource.status}>{resource.status}</ResourceStatus>
            </ResourceHeader>
            
            <DetailItem>
              <DetailLabel>Type:</DetailLabel>
              <DetailValue>{resource.type}</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Region:</DetailLabel>
              <DetailValue>{resource.region}</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Resource Group:</DetailLabel>
              <DetailValue>{resource.resourceGroup}</DetailValue>
            </DetailItem>
            
            {resource.type === 'App Service Plan' && (
              <ChartContainer>
                <Chart value={resource.metrics.cpu} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#333', fontWeight: 'bold' }}>
                  CPU: {resource.metrics.cpu}%
                </div>
              </ChartContainer>
            )}
            
            {resource.type === 'Function App' && (
              <ResourceDetails>
                <DetailItem>
                  <DetailLabel>Executions (24h):</DetailLabel>
                  <DetailValue>{resource.metrics.executions}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Errors:</DetailLabel>
                  <DetailValue>{resource.metrics.errors}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Avg. Duration:</DetailLabel>
                  <DetailValue>{resource.metrics.avgDuration} ms</DetailValue>
                </DetailItem>
              </ResourceDetails>
            )}
            
            {resource.type === 'Storage Account' && (
              <ResourceDetails>
                <DetailItem>
                  <DetailLabel>Used Capacity:</DetailLabel>
                  <DetailValue>{resource.metrics.usedCapacity} GB</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Transactions (24h):</DetailLabel>
                  <DetailValue>{resource.metrics.transactions}</DetailValue>
                </DetailItem>
              </ResourceDetails>
            )}
            
            {resource.type === 'Cognitive Search' && (
              <ResourceDetails>
                <DetailItem>
                  <DetailLabel>Query Latency:</DetailLabel>
                  <DetailValue>{resource.metrics.queryLatency} ms</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Documents:</DetailLabel>
                  <DetailValue>{resource.metrics.documentCount.toLocaleString()}</DetailValue>
                </DetailItem>
              </ResourceDetails>
            )}
            
            {resource.type === 'AI Document Intelligence' && (
              <ResourceDetails>
                <DetailItem>
                  <DetailLabel>Requests (24h):</DetailLabel>
                  <DetailValue>{resource.metrics.requestCount}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Error Rate:</DetailLabel>
                  <DetailValue style={{ color: resource.metrics.errorRate > 2 ? '#f5222d' : '#52c41a' }}>
                    {resource.metrics.errorRate}%
                  </DetailValue>
                </DetailItem>
              </ResourceDetails>
            )}
            
            <ResourceActions>
              <ActionButton>View Details</ActionButton>
              {(resource.status === 'Warning' || resource.status === 'Critical') && (
                <ActionButton onClick={() => restartResource(resource.id)}>Restart</ActionButton>
              )}
            </ResourceActions>
          </ResourceCard>
        ))}
      </ResourceGrid>
    </DashboardContainer>
  );
};

export default ResourceDashboard;
