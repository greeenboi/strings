import { INewPost, INewUser, IUpdatePost } from "@/types";
import { ID, Query } from "appwrite";
import { account, appwriteConfig, avatars, databases, storage } from "./config";


export async function createUserAccount( user: INewUser ){
    try {
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name,
        )

        if(!newAccount) throw new Error('Account not created')
        
        const avatarUrl = avatars.getInitials(user.name)
        const newUser = await saveUserToDB({
            accountId: newAccount.$id,
            name: newAccount.name,
            email: newAccount.email,
            username: user.username,
            imageUrl: avatarUrl,
        })
        
        return newUser
        
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function saveUserToDB( user: {
    accountId: string;
    email: string;
    name: string;
    imageUrl: URL;
    username?:string;
}) {
    
    try {
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            user,
        )

        return newUser;
    } catch (error) {
        console.log(error)
    }

}


export async function signInAccount( user: { 
    email: string; 
    password: string;
}) {
    try {
        const session = await account.createEmailSession(
            user.email,
            user.password,
        );
        return session;
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function getCurrentUser(  ) {
    try {
        const currentAccount = await account.get()

        if(!currentAccount) throw new Error('No current user');

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [
                Query.equal('accountId', currentAccount.$id)
            ]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0];       

    } catch (error) {
        console.log(error)
    }
}

export async function signOutAccount(  ) {
    try {
        const session = await account.deleteSession('current');

        return session;
    } catch (error) {
        console.log(error)
    }
}

export async function CreatePost (post: INewPost)  {
    try {
        const uploadedFile = await uploadFile(post.file[0]);

        if(!uploadedFile) throw new Error('File not uploaded');

        const fileUrl = getFilePreview(uploadedFile.$id);
        if(!fileUrl) {
            deleteFile(uploadedFile.$id)
            throw new Error('Url not recieved')
        }

        const tags = post.tags?.replace(/ /g,'').split(',') || [];

        const newPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            ID.unique(),
            {
                creator: post.userId,
                caption: post.caption,
                imageUrl: fileUrl,
                imageID: uploadedFile.$id,
                location: post.location,
                tags: tags,
            }
        )

        if(!newPost) {
            await deleteFile(uploadedFile.$id)
            throw new Error('Post not created')
        }

        return newPost;
    } catch (error) {
        console.log(error)
    }
  }

export async function uploadFile( file: File ) {
    try {
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            file,
        );

        return uploadedFile;
    } catch (error) {
        console.log(error)  
    }
}

export function getFilePreview( fileId: string ) {
    try {
        const fileUrl= storage.getFilePreview(
            appwriteConfig.storageId,
            fileId,
            2000,
            2000,
            "top",
            100,
        );

        return fileUrl;
    } catch (error) {
        console.log(error)
    }
}

export async function deleteFile( fileId: string ) {
    try {
        await storage.deleteFile(
            appwriteConfig.storageId,
            fileId,
        );

        return { status : 'ok' };
    } catch (error) {
        console.log(error)
    }
}


export async function getRecentPosts(  ) {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [
                Query.orderDesc('$createdAt'), Query.limit(20)
            ]
        )

        if(!posts) throw new Error('No recent posts');

        return posts;
    } catch (error) {
        console.log(error)
    }
}

export async function likePost( postId: string, likesArray: string[] ) {
    try {
        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId,
            {
                likes: likesArray,
            }
        )

        if(!updatedPost) throw new Error('Post not updated');

        return updatedPost;
    } catch (error) {
        console.log(error)
    }
}

export async function savePost( postId: string, userId: string ) { 
    try {
        const updatedPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            ID.unique(),
            {
                users: userId,
                post: postId,
            }
        )
        console.log('Here')
        if(!updatedPost){
            
            throw new Error('Post not updated')
        }
        return updatedPost;
    } catch (error) {
        console.log(error)
    }
}

export async function deleteSavedPost( savedRecordId: string ) { 
    try {
        const statusCode = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            savedRecordId,
        )
        if(!statusCode) throw new Error('Post not updated');

        return { status: 'ok' };
    } catch (error) {
        console.log(error)
    }
}

export async function getPostById( postId: string ) {
    try {
        const post = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId,
        )

        if(!post) throw new Error('No post found');

        return post;
    } catch (error) {
        console.log(error)
    }
}

export async function UpdatePost (post: IUpdatePost)  {
    const hasFileToUpdate = post.file.length >0;
    try {
        let image = {
            imageUrl: post.imageUrl,
            imageId: post.imageId,
        }

        if(hasFileToUpdate){
            const uploadedFile = await uploadFile(post.file[0]);

            if(!uploadedFile) throw new Error('File not uploaded');
            
            const fileUrl = getFilePreview(uploadedFile.$id);
            
            if(!fileUrl) {
                deleteFile(uploadedFile.$id)
                throw new Error('Url not recieved')
            }
            image = {...image, imageUrl: fileUrl, imageId: uploadedFile.$id}
        }

        const tags = post.tags?.replace(/ /g,'').split(',') || [];

        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            post.postId,
            {
                caption: post.caption,
                imageUrl: image.imageUrl,
                imageID: image.imageId,
                location: post.location,
                tags: tags,
            }
        )

        if(!updatedPost) {
            await deleteFile(post.imageId)
            throw new Error('Post not created')
        }

        return updatedPost;
    } catch (error) {
        console.log(error)
    }
  }

export async function deletePost(postId: string, imageId: string) {
    if(!postId || !imageId) throw new Error('No post or image id');

    try {
        await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId,
        )

        return { status : 'ok' }
    } catch (error) {
        console.log(error)
    }
}


export async function getInfinitePosts({ pageParam } : { pageParam: number }) {
    const queries: any[] = [Query.orderDesc('$updatedAt'), Query.limit(10)];

    if(pageParam) {
        queries.push(Query.cursorAfter(pageParam.toString()))
    }

    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            queries
        )

        if(!posts) throw new Error('No posts');

        return posts;
    } catch (error) {
        console.log(error)
    }
}


export async function searchPosts(searchTerm: string) {
    
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [Query.search('caption', searchTerm)]
        )

        if(!posts) throw new Error('No posts');
        return posts;
    } catch (error) {
        console.log(error)
    }
}

export async function getUsers(limit?: number) {
    const queries: any[] = [Query.orderDesc("$createdAt")];
  
    if (limit) {
      queries.push(Query.limit(limit));
    }
  
    try {
      const users = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        queries
      );
  
      if (!users) throw Error;
  
      return users;
    } catch (error) {
      console.log(error);
    }
  }

